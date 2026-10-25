import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Brand, CustomerAuth } from '../types';

interface NavbarProps {
    brand?: Brand;
    customer?: CustomerAuth | null;
    canLogin?: boolean;
    onOpenTrackModal: () => void;
}

export default function Navbar({ brand, customer, canLogin = true, onOpenTrackModal }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const phoneRaw = brand?.support_phone || '';
    const phoneClean = phoneRaw.replace(/[^0-9]/g, '');
    const waUrl = phoneClean 
        ? `https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}?text=${encodeURIComponent(`Halo ${brand?.name || 'Rental'}, saya ingin bertanya mengenai sewa mobil.`)}`
        : null;

    return (
        <header
            className={`sticky top-0 z-40 w-full transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3'
                    : 'bg-white/80 backdrop-blur-sm border-b border-slate-100/60 py-4'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            {brand?.logo_url ? (
                                <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="h-9 w-auto object-contain max-w-[140px]"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition">
                                    <span className="material-symbols-outlined text-[24px]">directions_car</span>
                                </div>
                            )}
                            <div>
                                <span className="font-heading font-black text-lg sm:text-xl text-slate-900 tracking-tight block leading-tight">
                                    {brand?.name || 'Rental Mobil'}
                                </span>
                                <span className="text-[11px] font-semibold text-teal-700 tracking-wider uppercase block">
                                    Layanan Rental Terpercaya
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700">
                        <a href="#armada" className="hover:text-teal-700 transition">Armada Mobil</a>
                        <a href="#layanan" className="hover:text-teal-700 transition">Layanan</a>
                        <a href="#keunggulan" className="hover:text-teal-700 transition">Keunggulan</a>
                        <a href="#cara-sewa" className="hover:text-teal-700 transition">Cara Sewa</a>
                        <a href="#faq" className="hover:text-teal-700 transition">FAQ</a>
                    </nav>

                    {/* Right Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        {/* Lacak Sewa Action */}
                        <button
                            type="button"
                            onClick={onOpenTrackModal}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-800 hover:border-teal-300 hover:bg-teal-50/50 text-xs font-bold transition"
                        >
                            <span className="material-symbols-outlined text-[18px] text-teal-600">travel_explore</span>
                            <span>Lacak Sewa</span>
                        </button>

                        {/* WhatsApp Quick Chat */}
                        {waUrl && (
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/80 text-xs font-bold transition"
                            >
                                <span className="material-symbols-outlined text-[18px] text-emerald-600">chat</span>
                                <span>WhatsApp</span>
                            </a>
                        )}

                        {/* Customer Portal or Login */}
                        {customer ? (
                            <Link
                                href={route('book.rental.portal.dashboard')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition"
                            >
                                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                                <span className="max-w-[100px] truncate">{customer.name}</span>
                            </Link>
                        ) : (
                            <Link
                                href={route('book.rental.login')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition"
                            >
                                <span className="material-symbols-outlined text-[16px]">login</span>
                                <span>Area Penyewa</span>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            type="button"
                            onClick={onOpenTrackModal}
                            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            title="Lacak Sewa"
                        >
                            <span className="material-symbols-outlined text-[20px] text-teal-700 block">travel_explore</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            aria-label="Toggle Menu"
                        >
                            <span className="material-symbols-outlined text-[24px] block">
                                {mobileMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-6 animate-fadeIn shadow-lg">
                    <nav className="flex flex-col gap-2.5 text-sm font-semibold text-slate-800 mb-5">
                        <a
                            href="#armada"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between"
                        >
                            <span>Armada Mobil</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                        </a>
                        <a
                            href="#layanan"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between"
                        >
                            <span>Layanan</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                        </a>
                        <a
                            href="#keunggulan"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between"
                        >
                            <span>Keunggulan</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                        </a>
                        <a
                            href="#cara-sewa"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between"
                        >
                            <span>Cara Sewa</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                        </a>
                        <a
                            href="#faq"
                            onClick={() => setMobileMenuOpen(false)}
                            className="px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between"
                        >
                            <span>FAQ</span>
                            <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                        </a>
                    </nav>

                    <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                onOpenTrackModal();
                            }}
                            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px] text-teal-600">travel_explore</span>
                            <span>Lacak Status Sewa</span>
                        </button>

                        {waUrl && (
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px] text-emerald-600">chat</span>
                                <span>Hubungi WhatsApp CS</span>
                            </a>
                        )}

                        {customer ? (
                            <Link
                                href={route('book.rental.portal.dashboard')}
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold text-center transition"
                            >
                                Dashboard Penyewa ({customer.name})
                            </Link>
                        ) : (
                            <Link
                                href={route('book.rental.login')}
                                className="w-full py-2.5 px-4 rounded-xl bg-teal-700 text-white text-xs font-bold text-center shadow-md shadow-teal-700/20 transition"
                            >
                                Masuk Area Penyewa
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

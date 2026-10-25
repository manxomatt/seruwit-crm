import React from 'react';
import { Link } from '@inertiajs/react';
import { Brand } from '../types';

interface FooterProps {
    brand?: Brand;
    canLogin?: boolean;
    onOpenTrackModal: () => void;
}

export default function Footer({ brand, canLogin = true, onOpenTrackModal }: FooterProps) {
    const currentYear = new Date().getFullYear();

    const phone = brand?.support_phone || '0812-3456-7890';
    const address = brand?.address || 'Layanan Antar-Jemput Seluruh Area Kota, Bandara & Stasiun';
    const email = brand?.contact_email || 'info@rentalmobil.com';
    const hours = brand?.business_hours || 'Buka Setiap Hari: 07:00 - 22:00 WIB (Layanan Antar 24 Jam)';

    return (
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Col 1: Brand Info (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2.5">
                            {brand?.logo_url ? (
                                <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="h-9 w-auto object-contain max-w-[150px] brightness-110"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-[24px]">directions_car</span>
                                </div>
                            )}
                            <span className="font-heading font-black text-xl text-white tracking-tight">
                                {brand?.name || 'Rental Mobil'}
                            </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                            Layanan sewa kendaraan dan rental mobil profesional dengan jaminan unit terawat, proses booking cepat, opsi lepas kunci atau dengan sopir, serta harga transparan.
                        </p>

                        {/* Social Links */}
                        <div className="pt-2 flex items-center gap-3">
                            {brand?.social?.instagram && (
                                <a
                                    href={brand.social.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-teal-500 transition"
                                    title="Instagram"
                                >
                                    <span className="font-bold text-xs">IG</span>
                                </a>
                            )}
                            {brand?.social?.facebook && (
                                <a
                                    href={brand.social.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-teal-500 transition"
                                    title="Facebook"
                                >
                                    <span className="font-bold text-xs">FB</span>
                                </a>
                            )}
                            {brand?.social?.tiktok && (
                                <a
                                    href={brand.social.tiktok}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-teal-500 transition"
                                    title="TikTok"
                                >
                                    <span className="font-bold text-xs">TT</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Col 2: Navigasi Cepat */}
                    <div className="space-y-3">
                        <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                            Navigasi
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <a href="#armada" className="hover:text-white transition">Armada Mobil</a>
                            </li>
                            <li>
                                <a href="#layanan" className="hover:text-white transition">Layanan Rental</a>
                            </li>
                            <li>
                                <a href="#keunggulan" className="hover:text-white transition">Keunggulan Kami</a>
                            </li>
                            <li>
                                <a href="#cara-sewa" className="hover:text-white transition">Panduan Cara Sewa</a>
                            </li>
                            <li>
                                <a href="#faq" className="hover:text-white transition">Tanya Jawab (FAQ)</a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Layanan & Akun */}
                    <div className="space-y-3">
                        <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                            Penyewa
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <button
                                    type="button"
                                    onClick={onOpenTrackModal}
                                    className="hover:text-white transition cursor-pointer text-left"
                                >
                                    Lacak Status Pesanan
                                </button>
                            </li>
                            <li>
                                <Link href={route('book.rental.login')} className="hover:text-white transition">
                                    Login Area Penyewa
                                </Link>
                            </li>
                            <li>
                                <Link href={route('book.rental.search')} className="hover:text-white transition">
                                    Katalog Online PWA
                                </Link>
                            </li>
                            {brand?.terms_url && (
                                <li>
                                    <a href={brand.terms_url} className="hover:text-white transition">
                                        Syarat & Ketentuan Sewa
                                    </a>
                                </li>
                            )}
                            {brand?.privacy_url && (
                                <li>
                                    <a href={brand.privacy_url} className="hover:text-white transition">
                                        Kebijakan Privasi
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Col 4: Kontak & Operasional */}
                    <div className="space-y-3">
                        <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider">
                            Hubungi Kami
                        </h4>
                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-[16px] text-teal-500 shrink-0 mt-0.5">
                                    location_on
                                </span>
                                <span>{address}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-teal-500 shrink-0">
                                    phone
                                </span>
                                <span>{phone}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-teal-500 shrink-0">
                                    schedule
                                </span>
                                <span>{hours}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>
                        © {currentYear} {brand?.name || 'Rental Mobil'}. Seluruh hak cipta dilindungi undang-undang.
                    </p>

                    <div className="flex items-center gap-4">
                        {canLogin && (
                            <Link href={route('login')} className="hover:text-slate-400 transition">
                                Portal Staf
                            </Link>
                        )}
                        <span className="text-slate-700">•</span>
                        <span>Rental Management System</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

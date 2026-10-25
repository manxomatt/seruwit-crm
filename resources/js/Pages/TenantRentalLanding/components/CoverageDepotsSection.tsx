import React from 'react';
import { LocationOption, Brand } from '../types';

interface CoverageDepotsProps {
    locations?: LocationOption[];
    brand?: Brand;
}

export default function CoverageDepotsSection({ locations = [], brand }: CoverageDepotsProps) {
    const defaultDepots = [
        {
            name: 'Hub Utama / Garasi Pusat',
            address: brand?.address || 'Area Pusat Kota & Akses Tol Utama',
            city: 'Pusat Kota',
        },
        {
            name: 'Titik Antar Bandara Internasional',
            address: 'Lobby Kedatangan Domestik & Internasional',
            city: 'Bandara',
        },
        {
            name: 'Stasiun Kereta Utama',
            address: 'Area Parkir Timur & Drop-off Penumpang',
            city: 'Stasiun Kereta',
        },
        {
            name: 'Antar Langsung ke Hotel & Alamat',
            address: 'Layanan Pengantaran ke seluruh area kota dan sekitarnya',
            city: 'Antar Alamat',
        },
    ];

    const displayDepots = locations.length > 0 
        ? locations.map((l) => ({
            name: l.name,
            address: l.address || 'Titik temu resmi serah terima kendaraan',
            city: l.city || 'Area Layanan',
        }))
        : defaultDepots;

    return (
        <section className="py-20 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-teal-600">place</span>
                        <span>Jangkauan Luas</span>
                    </div>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Titik Pengambilan & Jangkauan Antar-Jemput
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Nikmati kemudahan mengambil mobil di depot resmi kami atau meminta pengantaran langsung ke pintu kedatangan Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayDepots.slice(0, 4).map((depot, idx) => (
                        <div
                            key={idx}
                            className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-teal-400 hover:bg-white hover:shadow-lg transition-all duration-300"
                        >
                            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-[22px]">location_on</span>
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
                                {depot.city}
                            </span>
                            <h3 className="font-heading font-bold text-slate-900 text-base mb-2">
                                {depot.name}
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {depot.address}
                            </p>
                            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                <span className="material-symbols-outlined text-[14px] text-emerald-600">schedule</span>
                                <span>Buka 24 Jam dengan Reservasi</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

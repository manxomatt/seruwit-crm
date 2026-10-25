import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { VehicleCardItem, Brand, ClassOption } from '../types';
import { DEFAULT_SAMPLE_VEHICLES } from '../constants';

interface FleetShowcaseProps {
    vehicles?: VehicleCardItem[];
    brand?: Brand;
    classes?: ClassOption[];
}

const formatRupiah = (val?: number | null) => {
    if (!val) return 'Hubungi Kami';
    return 'Rp ' + Number(val).toLocaleString('id-ID');
};

export default function FleetShowcase({ vehicles = [], brand, classes = [] }: FleetShowcaseProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Display vehicles: use real vehicles if available, fallback to defaults
    const displayVehicles = useMemo(() => {
        if (vehicles && vehicles.length > 0) {
            return vehicles;
        }
        return DEFAULT_SAMPLE_VEHICLES;
    }, [vehicles]);

    // Categories
    const categories = useMemo(() => {
        const base = [{ value: 'all', label: 'Semua Armada' }];
        const existingClasses = new Set(displayVehicles.map((v) => v.rental_class).filter(Boolean));
        
        const dynamic = classes
            .filter((c) => existingClasses.has(c.value))
            .map((c) => ({ value: c.value, label: c.label }));

        if (dynamic.length > 0) {
            return [...base, ...dynamic];
        }

        return [
            ...base,
            { value: 'mpv', label: 'MPV Keluarga' },
            { value: 'suv', label: 'SUV Tangguh' },
            { value: 'economy', label: 'City Car' },
            { value: 'van', label: 'Minibus Rombongan' },
        ];
    }, [classes, displayVehicles]);

    // Filtered items
    const filteredVehicles = useMemo(() => {
        if (selectedCategory === 'all') return displayVehicles;
        return displayVehicles.filter((v) => v.rental_class === selectedCategory);
    }, [displayVehicles, selectedCategory]);

    const handleSelectVehicle = (vehicle: VehicleCardItem) => {
        // If real ID, go to vehicle show or search
        if (typeof vehicle.id === 'number') {
            router.visit(route('book.rental.search', {
                rental_class: vehicle.rental_class || undefined,
            }));
        } else {
            // Sample demo fallback
            router.visit(route('book.rental.search', {
                rental_class: vehicle.rental_class || undefined,
            }));
        }
    };

    const getWaVehicleInquiryUrl = (vehicleName: string) => {
        const phone = brand?.support_phone?.replace(/[^0-9]/g, '') || '081234567890';
        const num = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
        const msg = `Halo ${brand?.name || 'Rental'}, saya tertarik untuk sewa mobil *${vehicleName}*. Apakah unit tersedia untuk jadwal dekat ini?`;
        return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    };

    return (
        <section id="armada" className="py-20 bg-slate-50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-teal-600">directions_car</span>
                        <span>Pilihan Kendaraan Terbaik</span>
                    </div>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Koleksi Armada Mobil Terawat & Siap Jalan
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Pilih mobil yang sesuai dengan kebutuhan kapasitas dan kenyamanan perjalanan Anda. Semua unit dalam kondisi prima, wangi, dan ber-AC dingin.
                    </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                                selectedCategory === cat.value
                                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-105'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Vehicles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredVehicles.map((vehicle) => {
                        const fallbackImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
                        const imgSrc = vehicle.photo_url || fallbackImg;

                        return (
                            <div
                                key={vehicle.id}
                                className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
                            >
                                {/* Photo Container */}
                                <div className="relative h-52 sm:h-56 bg-slate-100 overflow-hidden">
                                    <img
                                        src={imgSrc}
                                        alt={vehicle.name}
                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = fallbackImg;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />

                                    {/* Badges on Image */}
                                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5">
                                        {vehicle.rental_class_label && (
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold tracking-wide">
                                                {vehicle.rental_class_label}
                                            </span>
                                        )}
                                        {vehicle.is_popular && (
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">star</span>
                                                Favorit
                                            </span>
                                        )}
                                    </div>

                                    {vehicle.transmission && (
                                        <div className="absolute top-3.5 right-3.5">
                                            <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold tracking-wide">
                                                {vehicle.transmission}
                                            </span>
                                        </div>
                                    )}

                                    {/* Key Specs Pill Bar on bottom of image */}
                                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-semibold">
                                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                            <span className="material-symbols-outlined text-[16px]">airline_seat_recline_normal</span>
                                            <span>{vehicle.capacity_seats || 5} Kursi</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                            <span className="material-symbols-outlined text-[16px]">local_gas_station</span>
                                            <span>{vehicle.fuel_label || 'Bensin'}</span>
                                        </div>
                                        {vehicle.model_year && (
                                            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                                <span>Tahun {vehicle.model_year}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Body Information */}
                                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-teal-700 transition">
                                            {vehicle.name}
                                        </h3>

                                        {/* Features List */}
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {(vehicle.features || ['Unit Bersih & Wangi', 'AC Dingin', 'Lepas Kunci Tersedia']).map((feat, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                                                >
                                                    <span className="text-teal-600 font-bold">✓</span>
                                                    <span>{feat}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pricing & CTA */}
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <div className="flex items-baseline justify-between">
                                            <div>
                                                <span className="text-xs text-slate-500 block font-medium">Mulai dari</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-teal-800 font-heading">
                                                        {formatRupiah(vehicle.from_price)}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500">/ hari</span>
                                                </div>
                                            </div>

                                            {vehicle.deposit_amount && (
                                                <div className="text-right">
                                                    <span className="text-[11px] text-slate-500 block">Jaminan Deposit</span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {formatRupiah(vehicle.deposit_amount)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-5 gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleSelectVehicle(vehicle)}
                                                className="col-span-4 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-700/20 transition cursor-pointer"
                                            >
                                                <span>Pilih & Pesan Mobil</span>
                                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            </button>

                                            <a
                                                href={getWaVehicleInquiryUrl(vehicle.name)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="col-span-1 inline-flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition"
                                                title={`Tanya unit ${vehicle.name} via WhatsApp`}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">chat</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom View All Link */}
                <div className="mt-12 text-center">
                    <button
                        type="button"
                        onClick={() => router.visit(route('book.rental.search'))}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-800 hover:border-teal-600 hover:text-teal-700 text-sm font-bold shadow-sm hover:shadow transition"
                    >
                        <span>Lihat Semua Unit & Kalender Ketersediaan</span>
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

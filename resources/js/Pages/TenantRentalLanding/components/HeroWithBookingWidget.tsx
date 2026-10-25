import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Brand, LocationOption, ClassOption } from '../types';

interface HeroProps {
    brand?: Brand;
    locations?: LocationOption[];
    classes?: ClassOption[];
}

export default function HeroWithBookingWidget({ brand, locations = [], classes = [] }: HeroProps) {
    // Current dates
    const today = useMemo(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const defaultEnd = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Form state
    const [serviceType, setServiceType] = useState<'self_drive' | 'with_driver'>('self_drive');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [pickupLocationId, setPickupLocationId] = useState<string>(locations[0]?.id ? String(locations[0].id) : '');
    const [sameReturnLocation, setSameReturnLocation] = useState(true);
    const [returnLocationId, setReturnLocationId] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');

    // Duration calculation
    const durationDays = useMemo(() => {
        if (!startDate || !endDate) return 1;
        const s = new Date(`${startDate}T00:00:00`);
        const e = new Date(`${endDate}T00:00:00`);
        const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    }, [startDate, endDate]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const query: Record<string, string> = {
            start_date: startDate,
            end_date: endDate,
            service_type: serviceType,
            period_type: 'daily',
        };

        if (pickupLocationId) {
            query.pickup_location_id = pickupLocationId;
            query.return_location_id = sameReturnLocation ? pickupLocationId : (returnLocationId || pickupLocationId);
        }

        if (selectedClass) {
            query.rental_class = selectedClass;
        }

        router.visit(route('book.rental.search', query));
    };

    const handleQuickClassSelect = (classVal: string) => {
        setSelectedClass(classVal === selectedClass ? '' : classVal);
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-10 pb-20 lg:pt-16 lg:pb-28">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.25),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.15),transparent_40%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Header Text */}
                <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-bold tracking-wide backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{brand?.name ? `${brand.name} • Official Rental Service` : 'Rental Kendaraan & Mobil Pilihan'}</span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                        {brand?.tagline || 'Perjalanan Nyaman, Unit Bersih & Harga Transparan'}
                    </h1>

                    {/* Subheadline */}
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        {brand?.description || 'Temukan kendaraan terbaik untuk liburan atau bisnis Anda. Opsi sewa lepas kunci bebas ribet atau sopir berpengalaman, tanpa biaya siluman.'}
                    </p>

                    {/* Trust Highlights */}
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-xs font-semibold text-slate-300">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Unit 100% Terawat & Higienis</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Bisa Antar ke Bandara/Hotel</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Jaminan Deposit Cepat Kembali</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Bantuan CS & Darurat 24/7</span>
                        </span>
                    </div>
                </div>

                {/* Floating Modern Booking Widget */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 text-slate-900 overflow-hidden transition-all duration-300">
                        {/* Service Type Switcher Tabs */}
                        <div className="bg-slate-50 border-b border-slate-200/80 p-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-2xl w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setServiceType('self_drive')}
                                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                                        serviceType === 'self_drive'
                                            ? 'bg-white text-teal-800 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">key</span>
                                    <span>Lepas Kunci (Self Drive)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setServiceType('with_driver')}
                                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                                        serviceType === 'with_driver'
                                            ? 'bg-white text-teal-800 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                    <span>Dengan Sopir (With Driver)</span>
                                </button>
                            </div>

                            <div className="hidden sm:flex items-center gap-2 pr-3 text-xs font-semibold text-slate-500">
                                <span className="material-symbols-outlined text-[18px] text-teal-600">verified</span>
                                <span>Verifikasi Cepat via WhatsApp</span>
                            </div>
                        </div>

                        {/* Search Form Form Fields */}
                        <form onSubmit={handleSearch} className="p-5 sm:p-7 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Pickup Location */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Lokasi Penjemputan
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 text-[20px]">
                                            location_on
                                        </span>
                                        <select
                                            value={pickupLocationId}
                                            onChange={(e) => setPickupLocationId(e.target.value)}
                                            className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition appearance-none cursor-pointer"
                                        >
                                            {locations.length > 0 ? (
                                                locations.map((loc) => (
                                                    <option key={loc.id} value={loc.id}>
                                                        {loc.name} {loc.city ? `(${loc.city})` : ''}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">Garasi Pusat / Antar Alamat</option>
                                            )}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Tanggal Mulai Sewa
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 text-[20px]">
                                            calendar_today
                                        </span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            min={today}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                if (e.target.value > endDate) {
                                                    setEndDate(e.target.value);
                                                }
                                            }}
                                            className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Tanggal Selesai
                                        </label>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-[11px] font-bold text-teal-700">
                                            {durationDays} Hari Sewa
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 text-[20px]">
                                            event_available
                                        </span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            min={startDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Vehicle Category */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Tipe Mobil
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 text-[20px]">
                                            category
                                        </span>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition appearance-none cursor-pointer"
                                        >
                                            <option value="">Semua Kategori Unit</option>
                                            {classes.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                                            expand_more
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Drop-off options & Submit */}
                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={sameReturnLocation}
                                        onChange={(e) => setSameReturnLocation(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                                    />
                                    <span>Kembalikan di lokasi jemput yang sama</span>
                                </label>

                                <button
                                    type="submit"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white text-sm font-extrabold shadow-lg shadow-teal-700/25 transition cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                    <span>Cari Mobil Tersedia</span>
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </button>
                            </div>
                        </form>

                        {/* Quick filter chips footer */}
                        <div className="bg-slate-50/80 px-5 sm:px-7 py-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="font-bold text-slate-700">Paling Dicari:</span>
                            {['MPV Keluarga', 'SUV Tangguh', 'City Car Lincah'].map((label, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        const mapping: Record<string, string> = {
                                            'MPV Keluarga': 'mpv',
                                            'SUV Tangguh': 'suv',
                                            'City Car Lincah': 'economy',
                                        };
                                        handleQuickClassSelect(mapping[label] || '');
                                    }}
                                    className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition ${
                                        selectedClass && selectedClass === (label === 'MPV Keluarga' ? 'mpv' : label === 'SUV Tangguh' ? 'suv' : 'economy')
                                            ? 'bg-teal-700 text-white border-teal-700'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

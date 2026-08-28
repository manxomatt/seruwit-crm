import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface Tier {
    id: number;
    name: string;
    min_vehicles: number;
    max_vehicles: number;
    price_per_vehicle: number;
    created_at: string;
}

interface Props {
    tiers: Tier[];
}

const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
};

const PencilIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

export default function Index({ tiers }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [deletingTier, setDeletingTier] = useState<Tier | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // Interactive simulator state
    const [simVehicles, setSimVehicles] = useState<number>(20);
    const [simInterval, setSimInterval] = useState<'month' | 'annual'>('month');

    const totalTiers = tiers.length;

    const sortedTiers = useMemo(() => {
        return [...tiers].sort((a, b) => a.min_vehicles - b.min_vehicles);
    }, [tiers]);

    const basePrice = useMemo(() => {
        return sortedTiers[0]?.price_per_vehicle || 20000;
    }, [sortedTiers]);

    const lowestPrice = useMemo(() => {
        if (sortedTiers.length === 0) return 0;
        return Math.min(...sortedTiers.map((t) => t.price_per_vehicle));
    }, [sortedTiers]);

    const maxCoveredVehicles = useMemo(() => {
        if (sortedTiers.length === 0) return 0;
        const highest = Math.max(...sortedTiers.map((t) => t.max_vehicles));
        return highest > 100000 ? '∞' : highest;
    }, [sortedTiers]);

    const filteredTiers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return sortedTiers;

        return sortedTiers.filter((tier) => {
            return (
                tier.name.toLowerCase().includes(q) ||
                tier.min_vehicles.toString().includes(q) ||
                tier.max_vehicles.toString().includes(q) ||
                tier.price_per_vehicle.toString().includes(q)
            );
        });
    }, [sortedTiers, search]);

    // Simulator calculation
    const matchedTier = useMemo(() => {
        return sortedTiers.find(
            (t) => simVehicles >= t.min_vehicles && simVehicles <= t.max_vehicles,
        ) || sortedTiers[sortedTiers.length - 1];
    }, [sortedTiers, simVehicles]);

    const simUnitRate = matchedTier ? matchedTier.price_per_vehicle : basePrice;
    const simMonthlyTotal = simVehicles * simUnitRate;
    const simAnnualTotal = simMonthlyTotal * 10; // Pay 10 months for annual (2 months discount)
    const simFinalTotal = simInterval === 'annual' ? simAnnualTotal : simMonthlyTotal;
    const simDiscountVsBase = basePrice > simUnitRate ? Math.round((1 - simUnitRate / basePrice) * 100) : 0;

    const getDiscount = (price: number) => {
        if (basePrice <= price) return 0;
        return Math.round((1 - price / basePrice) * 100);
    };

    const confirmDelete = (tier: Tier): void => {
        setDeletingTier(tier);
    };

    const handleDelete = (): void => {
        if (!deletingTier) return;
        setIsDeleting(true);
        router.delete(route('module.subscription-tiers.destroy', deletingTier.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingTier(null);
            },
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Subscription Tiers"
                    description="Kelola skema harga bertingkat berbasis kapasitas unit armada untuk tenant"
                    actions={
                        <Link
                            href={route('module.subscription-tiers.create')}
                            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            <span>Tambah Tier Baru</span>
                        </Link>
                    }
                />
            }
        >
            <Head title="Subscription Tiers" />

            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-sm shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                                ✓
                            </span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
                                !
                            </span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Hero Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 border border-indigo-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Total Tier Dikonfigurasi
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {totalTiers}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Skema bertingkat aktif
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent p-5 border border-sky-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            Harga Dasar (Tier 1)
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {formatRupiah(basePrice)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            per unit kendaraan / bulan
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 border border-emerald-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Harga Unit Terbaik
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(lowestPrice)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Volume diskon maksimal {getDiscount(lowestPrice)}%
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-5 border border-amber-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Cakupan Kapasitas
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            1 – {maxCoveredVehicles} Unit
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Skala armada tenant yang didukung
                        </p>
                    </div>
                </div>

                {/* Live Pricing Simulator Widget */}
                {sortedTiers.length > 0 && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                        
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                            {/* Simulator Inputs */}
                            <div className="flex-1 w-full space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm3-6h.008v.008H11.25v-.008zm0 3h.008v.008H11.25v-.008zm0 3h.008v.008H11.25v-.008zm3-6h.008v.008H14.25v-.008zm0 3h.008v.008H14.25v-.008zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold tracking-tight text-white">
                                                Simulator & Kalkulator Harga Tier
                                            </h3>
                                            <p className="text-xs text-indigo-200/70">
                                                Simulasi kalkulasi biaya langganan otomatis berdasarkan jumlah unit
                                            </p>
                                        </div>
                                    </div>

                                    {/* Interval Toggle */}
                                    <div className="flex items-center rounded-xl bg-white/10 p-1 border border-white/10 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setSimInterval('month')}
                                            className={`rounded-lg px-3 py-1 font-medium transition-all ${
                                                simInterval === 'month'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-indigo-200 hover:text-white'
                                            }`}
                                        >
                                            Bulanan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSimInterval('annual')}
                                            className={`rounded-lg px-3 py-1 font-medium transition-all flex items-center gap-1 ${
                                                simInterval === 'annual'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-indigo-200 hover:text-white'
                                            }`}
                                        >
                                            <span>Tahunan</span>
                                            <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] px-1 py-0.2 border border-emerald-400/30">
                                                Hemat 2 bln
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Slider & Input Control */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-indigo-200/80">Jumlah Kendaraan / Armada:</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={500}
                                                value={simVehicles}
                                                onChange={(e) => setSimVehicles(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-20 rounded-lg bg-white/10 border border-white/20 px-2.5 py-1 text-right text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                            />
                                            <span className="text-xs text-indigo-300">Unit</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={200}
                                        value={simVehicles}
                                        onChange={(e) => setSimVehicles(parseInt(e.target.value))}
                                        className="w-full accent-indigo-500 h-2 bg-white/20 rounded-lg cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-indigo-300/60">
                                        <span>1 Unit</span>
                                        <span>50 Unit</span>
                                        <span>100 Unit</span>
                                        <span>150 Unit</span>
                                        <span>200+ Unit</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simulator Result Card */}
                            <div className="w-full lg:w-80 rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur-md flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-medium text-indigo-200 uppercase tracking-wider">
                                            Tier Terpilih
                                        </span>
                                        {matchedTier && (
                                            <span className="rounded-full bg-indigo-500/30 border border-indigo-400/30 px-2.5 py-0.5 text-xs font-bold text-indigo-200">
                                                {matchedTier.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <div className="text-xs text-indigo-200/80">Total Tagihan ({simInterval === 'annual' ? 'Per Tahun' : 'Per Bulan'}):</div>
                                        <div className="text-2xl font-extrabold text-white mt-0.5">
                                            {formatRupiah(simFinalTotal)}
                                        </div>
                                    </div>

                                    <div className="pt-1 flex items-center justify-between text-xs border-t border-white/10 text-indigo-200/90">
                                        <span>Tarif per unit:</span>
                                        <span className="font-semibold text-white">
                                            {formatRupiah(simUnitRate)} / unit
                                        </span>
                                    </div>

                                    {simDiscountVsBase > 0 && (
                                        <div className="flex items-center justify-between text-xs text-emerald-400">
                                            <span>Hemat volume:</span>
                                            <span className="font-bold">
                                                {simDiscountVsBase}% lebih hemat
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toolbar: Search, View Switcher & Action */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    {/* Search Bar */}
                    <div className="relative min-w-[280px] sm:min-w-[340px] flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                            </svg>
                        </span>
                        <TextInput
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama tier atau rentang kapasitas..."
                            className="w-full pl-9 pr-8 py-1.5 text-sm rounded-xl border-slate-200 dark:border-slate-800"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Switcher */}
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                title="Table View"
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                                className={`rounded-lg p-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </button>
                        </div>

                        <Link
                            href={route('module.subscription-tiers.create')}
                            className="inline-flex items-center rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            <span>Buat Tier</span>
                        </Link>
                    </div>
                </div>

                {/* Content Area */}
                {filteredTiers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            Tidak ada tier yang ditemukan
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {search
                                ? 'Coba sesuaikan kata kunci pencarian Anda.'
                                : 'Belum ada tier langganan yang dibuat. Buat tier pertama Anda.'}
                        </p>
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                Reset Pencarian
                            </button>
                        ) : (
                            <Link
                                href={route('module.subscription-tiers.create')}
                                className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                            >
                                <span>Buat Tier Pertama</span>
                            </Link>
                        )}
                    </div>
                ) : viewMode === 'table' ? (
                    /* Modern Table View */
                    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-5">Nama Tier</th>
                                    <th className="py-3.5 px-5">Rentang Kapasitas</th>
                                    <th className="py-3.5 px-5">Harga per Unit</th>
                                    <th className="py-3.5 px-5">Diskon Volume</th>
                                    <th className="py-3.5 px-5">Contoh Biaya (Bulanan)</th>
                                    <th className="py-3.5 px-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTiers.map((tier) => {
                                    const discount = getDiscount(tier.price_per_vehicle);
                                    const sampleMin = tier.min_vehicles * tier.price_per_vehicle;
                                    const sampleMax =
                                        tier.max_vehicles <= 100000
                                            ? tier.max_vehicles * tier.price_per_vehicle
                                            : null;

                                    return (
                                        <tr key={tier.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                                        #{tier.id}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-white">
                                                            {tier.name}
                                                        </span>
                                                        <div className="text-[11px] text-slate-400">
                                                            Dibuat: {tier.created_at}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                                    {tier.min_vehicles} – {tier.max_vehicles > 100000 ? '∞' : tier.max_vehicles} Unit
                                                </span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {formatRupiah(tier.price_per_vehicle)}
                                                </div>
                                                <div className="text-[11px] text-slate-400">per kendaraan / bln</div>
                                            </td>
                                            <td className="py-4 px-5">
                                                {discount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-bold border border-emerald-500/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Hemat {discount}%
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Tarif Standar</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 text-xs text-slate-600 dark:text-slate-400">
                                                <div>
                                                    <strong>{tier.min_vehicles} unit:</strong> {formatRupiah(sampleMin)}
                                                </div>
                                                {sampleMax && (
                                                    <div className="text-slate-400">
                                                        <strong>{tier.max_vehicles} unit:</strong> {formatRupiah(sampleMax)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={route('module.subscription-tiers.edit', tier.id)}
                                                        title="Edit Tier"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
                                                    >
                                                        <PencilIcon />
                                                        <span>Edit</span>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmDelete(tier)}
                                                        title="Hapus Tier"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 transition-colors shadow-sm"
                                                    >
                                                        <TrashIcon />
                                                        <span>Hapus</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Modern Grid View */
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTiers.map((tier) => {
                            const discount = getDiscount(tier.price_per_vehicle);

                            return (
                                <div
                                    key={tier.id}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                                >
                                    <div>
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                        {tier.name}
                                                    </h3>
                                                </div>
                                                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
                                                    {tier.min_vehicles} – {tier.max_vehicles > 100000 ? '∞' : tier.max_vehicles} Unit
                                                </div>
                                            </div>

                                            {discount > 0 && (
                                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-bold border border-emerald-500/20">
                                                    Hemat {discount}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Pricing Block */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                Tarif per Kendaraan:
                                            </div>
                                            <div className="mt-1 flex items-baseline gap-1">
                                                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                                    {formatRupiah(tier.price_per_vehicle)}
                                                </span>
                                                <span className="text-xs text-slate-400">/ bulan</span>
                                            </div>
                                        </div>

                                        {/* Calculation Preview */}
                                        <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                                Simulasi Biaya Cepat:
                                            </div>
                                            <div className="flex justify-between">
                                                <span>• {tier.min_vehicles} unit:</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    {formatRupiah(tier.min_vehicles * tier.price_per_vehicle)}
                                                </span>
                                            </div>
                                            {tier.max_vehicles <= 100000 && (
                                                <div className="flex justify-between">
                                                    <span>• {tier.max_vehicles} unit:</span>
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {formatRupiah(tier.max_vehicles * tier.price_per_vehicle)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                                        <Link
                                            href={route('module.subscription-tiers.edit', tier.id)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
                                        >
                                            <PencilIcon />
                                            <span>Edit</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => confirmDelete(tier)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 py-2 text-center text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm"
                                        >
                                            <TrashIcon />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Explanation Card */}
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 text-xs text-indigo-900 dark:text-indigo-200">
                    <div className="flex items-center gap-2 font-bold mb-2">
                        <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <span>Cara Kerja Penetapan Harga Tier Armada (Pay-As-You-Grow)</span>
                    </div>
                    <ul className="space-y-1.5 pl-6 list-disc text-indigo-800/80 dark:text-indigo-300/80">
                        <li>Tenant memilih kuota armada yang ingin dikelola dalam workspace mereka.</li>
                        <li>Sistem secara otomatis mendeteksi tier yang sesuai dengan rentang jumlah kendaraan.</li>
                        <li>Formula tagihan: <code className="bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded font-mono font-bold">Jumlah Unit × Tarif per Unit</code>.</li>
                        <li>Untuk interval tahunan, tagihan dikalikan 10 bulan (diskon 2 bulan gratis).</li>
                        <li>Perubahan tarif tier akan langsung berlaku untuk aktivasi atau perpanjangan langganan baru.</li>
                    </ul>
                </div>
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDeleteDialog
                show={deletingTier !== null}
                onClose={() => setDeletingTier(null)}
                onConfirm={handleDelete}
                title={`Hapus Tier "${deletingTier?.name ?? ''}"?`}
                message="Tier ini akan dihapus dari daftar skema harga. Konfigurasi tenant yang sudah aktif sebelumnya tidak akan terpengaruh."
                confirmText="Hapus Tier"
                processing={isDeleting}
            />
        </DynamicLayout>
    );
}


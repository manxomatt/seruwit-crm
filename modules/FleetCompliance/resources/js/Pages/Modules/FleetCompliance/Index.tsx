import DynamicLayout from '@/Layouts/DynamicLayout';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import ComplianceNav from '../../../ComplianceNav';

interface DocumentStatus {
    status: 'expired' | 'expiring_soon' | 'safe' | 'not_set';
    days: number | null;
    label: string;
    date?: string | null;
    provider?: string | null;
    policy_number?: string | null;
    type?: string | null;
}

interface ComplianceSummary {
    overall: 'expired' | 'expiring_soon' | 'safe' | 'incomplete';
    stnk_annual: DocumentStatus;
    stnk_five_year: DocumentStatus;
    insurance: DocumentStatus;
    kir: DocumentStatus;
}

interface VehicleItem {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    brand: string | null;
    ownership_type: string;
    partner_id: number | null;
    home_base_id: number | null;
    home_base?: { id: number; code: string; name: string } | null;
    partner?: { id: number; code: string; name: string; phone: string | null } | null;
    compliance_summary: ComplianceSummary;
}

interface RenewalLog {
    id: number;
    vehicle_id: number;
    document_type: string;
    previous_expires_at: string | null;
    new_expires_at: string;
    renewal_date: string;
    cost: number;
    payer: string;
    reference_number: string | null;
    notes: string | null;
    vehicle?: { id: number; plate_number: string; name: string; type: string } | null;
    partner?: { id: number; name: string } | null;
    creator?: { id: number; name: string } | null;
}

interface Props {
    vehicles: VehicleItem[];
    kpi: {
        total_monitored: number;
        expired_count: number;
        expiring_soon_count: number;
        safe_count: number;
    };
    recentRenewals: RenewalLog[];
    bases: Array<{ id: number; code: string; name: string }>;
    partners: Array<{ id: number; code: string; name: string }>;
    filters: {
        search: string;
        status: string;
        document: string;
        home_base_id: number | null;
        ownership_type: string;
    };
}

export default function ComplianceIndex({
    vehicles,
    kpi,
    recentRenewals,
    bases,
    partners,
    filters,
}: Props): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [activeTab, setActiveTab] = useState<'board' | 'history'>('board');
    const [search, setSearch] = useState(filters.search);
    const [selectedVehicleForRenew, setSelectedVehicleForRenew] = useState<VehicleItem | null>(null);

    // Renewal Modal Form
    const {
        data: renewData,
        setData: setRenewData,
        post: postRenew,
        processing: renewProcessing,
        errors: renewErrors,
        reset: resetRenew,
    } = useForm({
        document_type: 'stnk_annual',
        new_expires_at: '',
        renewal_date: new Date().toISOString().slice(0, 10),
        cost: '',
        payer: 'tenant',
        insurance_provider: '',
        insurance_policy_number: '',
        insurance_type: 'all_risk',
        reference_number: '',
        notes: '',
    });

    const openRenewModal = (vehicle: VehicleItem, defaultDocType: string = 'stnk_annual') => {
        setSelectedVehicleForRenew(vehicle);
        setRenewData({
            document_type: defaultDocType,
            new_expires_at: '',
            renewal_date: new Date().toISOString().slice(0, 10),
            cost: '',
            payer: vehicle.ownership_type === 'investor' ? 'owner' : 'tenant',
            insurance_provider: vehicle.compliance_summary.insurance.provider || '',
            insurance_policy_number: vehicle.compliance_summary.insurance.policy_number || '',
            insurance_type: vehicle.compliance_summary.insurance.type || 'all_risk',
            reference_number: '',
            notes: '',
        });
    };

    const getRenewTargetRoute = (vehicleId: number): string => {
        if (routeExists(prefixedRoute('fleet-compliance.vehicles.renew', vehicleId))) {
            return prefixedRoute('fleet-compliance.vehicles.renew', vehicleId);
        }
        return prefixedRoute('fleet.compliance.renew', vehicleId);
    };

    const routeExists = (routeName: string): boolean => {
        return route().has(routeName) || route().has(`central.${routeName}`);
    };

    const handleRenewSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedVehicleForRenew) return;

        postRenew(getRenewTargetRoute(selectedVehicleForRenew.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedVehicleForRenew(null);
                resetRenew();
            },
        });
    };

    const applyFilter = (newFilters: Partial<typeof filters>) => {
        const merged = { ...filters, ...newFilters };
        const query: Record<string, string> = {};

        if (merged.search) query.search = merged.search;
        if (merged.status && merged.status !== 'all') query.status = merged.status;
        if (merged.document && merged.document !== 'all') query.document = merged.document;
        if (merged.home_base_id) query.home_base_id = String(merged.home_base_id);
        if (merged.ownership_type) query.ownership_type = merged.ownership_type;

        const target = routeExists(prefixedRoute('fleet-compliance.index'))
            ? prefixedRoute('fleet-compliance.index')
            : (isCurrentRoute('documents.compliance.*') ? prefixedRoute('documents.compliance.index') : prefixedRoute('fleet.compliance.index'));

        router.get(target, query, {
            preserveState: true,
            replace: true,
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(localeTag, {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString(localeTag, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderStatusBadge = (doc: DocumentStatus, onRenew?: () => void) => {
        if (doc.status === 'not_set') {
            return (
                <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Belum Diatur
                    </span>
                    {onRenew && (
                        <button
                            type="button"
                            onClick={onRenew}
                            className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            + Atur Tanggal
                        </button>
                    )}
                </div>
            );
        }

        if (doc.status === 'expired') {
            return (
                <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700 ring-1 ring-inset ring-rose-600/30 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                        <span>Kadaluarsa ({Math.abs(doc.days ?? 0)} hr)</span>
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(doc.date)}
                    </span>
                    {onRenew && (
                        <button
                            type="button"
                            onClick={onRenew}
                            className="text-[10px] font-black text-rose-600 hover:underline dark:text-rose-400"
                        >
                            Perpanjang Sekarang →
                        </button>
                    )}
                </div>
            );
        }

        if (doc.status === 'expiring_soon') {
            return (
                <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 ring-1 ring-inset ring-amber-600/30 dark:bg-amber-950/60 dark:text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>Sisa {doc.days} hari</span>
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(doc.date)}
                    </span>
                    {onRenew && (
                        <button
                            type="button"
                            onClick={onRenew}
                            className="text-[10px] font-bold text-amber-600 hover:underline dark:text-amber-400"
                        >
                            Perpanjang Dokumen →
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col items-start gap-0.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Aman ({doc.days} hr)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {formatDate(doc.date)}
                </span>
            </div>
        );
    };

    return (
        <DynamicLayout>
            <Head title="Kepatuhan & Pajak Armada (STNK, KIR, Asuransi)" />

            <PageHeader
                title="Kepatuhan & Pajak Armada"
                subtitle="Matriks jatuh tempo legalitas unit: Pajak STNK Tahunan, 5 Tahunan (Plat), Asuransi & Uji KIR."
            />

            <ComplianceNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div
                    onClick={() => applyFilter({ status: 'all' })}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        filters.status === 'all'
                            ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-950/20 shadow-sm'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                >
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Dipantau</p>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                        {kpi.total_monitored} <span className="text-xs font-medium text-slate-500">unit</span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">Unit aktif & servis</p>
                </div>

                <div
                    onClick={() => applyFilter({ status: 'expired' })}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        filters.status === 'expired'
                            ? 'border-rose-500 bg-rose-50/50 dark:border-rose-500/50 dark:bg-rose-950/20 shadow-sm'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Kadaluarsa</p>
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    </div>
                    <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                        {kpi.expired_count} <span className="text-xs font-medium text-slate-500">unit</span>
                    </p>
                    <p className="mt-1 text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">Harus segera diurus</p>
                </div>

                <div
                    onClick={() => applyFilter({ status: 'expiring_soon' })}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        filters.status === 'expiring_soon'
                            ? 'border-amber-500 bg-amber-50/50 dark:border-amber-500/50 dark:bg-amber-950/20 shadow-sm'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                >
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Jatuh Tempo &lt; 30 Hari</p>
                    <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                        {kpi.expiring_soon_count} <span className="text-xs font-medium text-slate-500">unit</span>
                    </p>
                    <p className="mt-1 text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">Persiapkan perpanjangan</p>
                </div>

                <div
                    onClick={() => applyFilter({ status: 'safe' })}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        filters.status === 'safe'
                            ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-500/50 dark:bg-emerald-950/20 shadow-sm'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                >
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Legalitas Aman</p>
                    <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {kpi.safe_count} <span className="text-xs font-medium text-slate-500">unit</span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">Semua dokumen &gt; 30 hari</p>
                </div>
            </div>

            {/* Tab: Matrix Board */}
            {activeTab === 'board' && (
                <div className="space-y-4">
                    {/* Filters Toolbar */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    applyFilter({ search });
                                }}
                                className="w-full sm:w-64"
                            >
                                <TextInput
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari plat nomor / unit..."
                                    className="w-full text-xs"
                                />
                            </form>

                            {/* Status Filter */}
                            <select
                                value={filters.status}
                                onChange={(e) => applyFilter({ status: e.target.value })}
                                className="rounded-xl border border-slate-200/80 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="all">Semua Status Legalitas</option>
                                <option value="expired">🚨 Hanya Kadaluarsa</option>
                                <option value="expiring_soon">⚠️ Jatuh Tempo &lt; 30 Hari</option>
                                <option value="safe">✅ Aman</option>
                                <option value="incomplete">⚪ Dokumen Belum Lengkap</option>
                            </select>

                            {/* Document Type Filter */}
                            <select
                                value={filters.document}
                                onChange={(e) => applyFilter({ document: e.target.value })}
                                className="rounded-xl border border-slate-200/80 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="all">Semua Jenis Dokumen</option>
                                <option value="stnk_annual">Kritis: Pajak STNK Tahunan</option>
                                <option value="stnk_five_year">Kritis: Plat 5 Tahunan</option>
                                <option value="insurance">Kritis: Asuransi Kendaraan</option>
                                <option value="kir">Kritis: Uji Berkala KIR</option>
                            </select>

                            {/* Base Filter */}
                            {bases.length > 0 && (
                                <select
                                    value={filters.home_base_id || ''}
                                    onChange={(e) => applyFilter({ home_base_id: e.target.value ? Number(e.target.value) : null })}
                                    className="rounded-xl border border-slate-200/80 bg-white py-1.5 px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="">Semua Pool / Depo</option>
                                    {bases.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.code})
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Ownership Type */}
                            <select
                                value={filters.ownership_type}
                                onChange={(e) => applyFilter({ ownership_type: e.target.value })}
                                className="rounded-xl border border-slate-200/80 bg-white py-1.5 px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <option value="">Semua Kepemilikan</option>
                                <option value="internal">Aset Internal (Owned)</option>
                                <option value="investor">Titipan Investor</option>
                                <option value="vendor_sublease">Sublease Rental</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            {(filters.search || filters.status !== 'all' || filters.document !== 'all' || filters.home_base_id || filters.ownership_type) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilter({
                                            search: '',
                                            status: 'all',
                                            document: 'all',
                                            home_base_id: null,
                                            ownership_type: '',
                                        });
                                    }}
                                    className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
                                >
                                    Reset Filter
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Matrix Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Kendaraan</th>
                                        <th scope="col" className="px-4 py-3">Pool & Kepemilikan</th>
                                        <th scope="col" className="px-4 py-3 min-w-[130px]">Pajak STNK 1 Thn</th>
                                        <th scope="col" className="px-4 py-3 min-w-[130px]">Plat STNK 5 Thn</th>
                                        <th scope="col" className="px-4 py-3 min-w-[140px]">Asuransi Unit</th>
                                        <th scope="col" className="px-4 py-3 min-w-[130px]">Uji Berkala KIR</th>
                                        <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {vehicles.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                                Tidak ada kendaraan yang cocok dengan filter kepatuhan saat ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        vehicles.map((v) => {
                                            const s = v.compliance_summary;

                                            return (
                                                <tr
                                                    key={v.id}
                                                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                                                        s.overall === 'expired'
                                                            ? 'bg-rose-50/20 dark:bg-rose-950/10'
                                                            : s.overall === 'expiring_soon'
                                                            ? 'bg-amber-50/20 dark:bg-amber-950/10'
                                                            : ''
                                                    }`}
                                                >
                                                    {/* Vehicle Plate & Name */}
                                                    <td className="px-4 py-3 font-medium">
                                                        <div className="flex flex-col">
                                                            <Link
                                                                href={prefixedRoute('fleet.vehicles.show', v.id)}
                                                                className="font-mono text-sm font-black text-indigo-600 hover:underline dark:text-indigo-400"
                                                            >
                                                                {v.plate_number}
                                                            </Link>
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                {v.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 capitalize">
                                                                {v.type} {v.brand ? `• ${v.brand}` : ''}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Pool & Ownership */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                {v.home_base?.name || 'Pool Pusat'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {v.ownership_type === 'investor' ? (
                                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                                        Investor: {v.partner?.name || '—'}
                                                                    </span>
                                                                ) : v.ownership_type === 'vendor_sublease' ? (
                                                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                                        Sublease: {v.partner?.name || '—'}
                                                                    </span>
                                                                ) : (
                                                                    'Aset Internal'
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* STNK 1 Year */}
                                                    <td className="px-4 py-3">
                                                        {renderStatusBadge(s.stnk_annual, () => openRenewModal(v, 'stnk_annual'))}
                                                    </td>

                                                    {/* STNK 5 Year */}
                                                    <td className="px-4 py-3">
                                                        {renderStatusBadge(s.stnk_five_year, () => openRenewModal(v, 'stnk_five_year'))}
                                                    </td>

                                                    {/* Insurance */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col items-start gap-1">
                                                            {renderStatusBadge(s.insurance, () => openRenewModal(v, 'insurance'))}
                                                            {s.insurance.provider && (
                                                                <span className="text-[10px] text-slate-400">
                                                                    {s.insurance.provider} ({s.insurance.type?.toUpperCase() || 'ASURANSI'})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* KIR */}
                                                    <td className="px-4 py-3">
                                                        {renderStatusBadge(s.kir, () => openRenewModal(v, 'kir'))}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openRenewModal(v)}
                                                                className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
                                                            >
                                                                + Perbarui
                                                            </button>
                                                            <Link
                                                                href={prefixedRoute('fleet.vehicles.show', v.id)}
                                                                className="rounded-lg bg-slate-100 p-1 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                                title="Detail Unit"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                                </svg>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: History Log */}
            {activeTab === 'history' && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200/80 p-4 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat Transaksi Perpanjangan</h3>
                            <p className="text-xs text-slate-400">Log audit biaya dan pembaruan dokumen legalitas kendaraan.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Tgl Perpanjangan</th>
                                    <th scope="col" className="px-4 py-3">Kendaraan</th>
                                    <th scope="col" className="px-4 py-3">Jenis Dokumen</th>
                                    <th scope="col" className="px-4 py-3">Masa Berlaku Baru</th>
                                    <th scope="col" className="px-4 py-3">Biaya</th>
                                    <th scope="col" className="px-4 py-3">Beban Biaya</th>
                                    <th scope="col" className="px-4 py-3">Referensi & Catatan</th>
                                    <th scope="col" className="px-4 py-3">Dicatat Oleh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recentRenewals.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                            Belum ada riwayat perpanjangan dokumen yang tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    recentRenewals.map((log) => {
                                        const docLabel = matchDocLabel(log.document_type);

                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                                                    {formatDate(log.renewal_date)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                            {log.vehicle?.plate_number}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {log.vehicle?.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {docLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {formatDate(log.new_expires_at)}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(log.cost)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        log.payer === 'tenant'
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                            : log.payer === 'owner'
                                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                    }`}>
                                                        {log.payer === 'tenant' ? 'Rental (Perusahaan)' : log.payer === 'owner' ? 'Pemilik Unit' : 'Bagi Bersama'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        {log.reference_number && (
                                                            <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                                No: {log.reference_number}
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-slate-400 truncate max-w-xs">
                                                            {log.notes || '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {log.creator?.name || 'Sistem'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Perpanjangan Dokumen */}
            <Modal
                show={selectedVehicleForRenew !== null}
                onClose={() => setSelectedVehicleForRenew(null)}
                maxWidth="lg"
            >
                {selectedVehicleForRenew && (
                    <form onSubmit={handleRenewSubmit} className="p-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Catat Perpanjangan Dokumen
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {selectedVehicleForRenew.plate_number} • {selectedVehicleForRenew.name}
                                </p>
                            </div>
                            <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-mono font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {selectedVehicleForRenew.plate_number}
                            </span>
                        </div>

                        <div className="mt-4 space-y-3.5">
                            {/* Document Type Selection */}
                            <div className="space-y-1">
                                <InputLabel value="Jenis Dokumen yang Diperpanjang" />
                                <select
                                    value={renewData.document_type}
                                    onChange={(e) => setRenewData('document_type', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="stnk_annual">Pajak STNK Tahunan</option>
                                    <option value="stnk_five_year">Ganti Plat / STNK 5 Tahunan</option>
                                    <option value="insurance">Polis Asuransi Kendaraan</option>
                                    <option value="kir">Uji Berkala KIR</option>
                                </select>
                            </div>

                            {/* Dates: Renewal Date & New Expiration Date */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <InputLabel value="Tgl Pembayaran / Pengurusan" />
                                    <TextInput
                                        type="date"
                                        value={renewData.renewal_date}
                                        onChange={(e) => setRenewData('renewal_date', e.target.value)}
                                        className="w-full text-xs"
                                        required
                                    />
                                    <InputError message={renewErrors.renewal_date} />
                                </div>
                                <div className="space-y-1">
                                    <InputLabel value="Tanggal Jatuh Tempo Baru" />
                                    <TextInput
                                        type="date"
                                        value={renewData.new_expires_at}
                                        onChange={(e) => setRenewData('new_expires_at', e.target.value)}
                                        className="w-full text-xs font-bold text-indigo-600 dark:text-indigo-400"
                                        required
                                    />
                                    <InputError message={renewErrors.new_expires_at} />
                                </div>
                            </div>

                            {/* Conditional Insurance Fields */}
                            {renewData.document_type === 'insurance' && (
                                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200/60 dark:border-slate-700/60">
                                    <div className="space-y-1">
                                        <InputLabel value="Perusahaan Asuransi" />
                                        <TextInput
                                            value={renewData.insurance_provider}
                                            onChange={(e) => setRenewData('insurance_provider', e.target.value)}
                                            placeholder="cth: ACA, Garda Oto"
                                            className="w-full text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <InputLabel value="Nomor Polis" />
                                        <TextInput
                                            value={renewData.insurance_policy_number}
                                            onChange={(e) => setRenewData('insurance_policy_number', e.target.value)}
                                            placeholder="POL-992182"
                                            className="w-full text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <InputLabel value="Tipe Asuransi" />
                                        <select
                                            value={renewData.insurance_type}
                                            onChange={(e) => setRenewData('insurance_type', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-2 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                        >
                                            <option value="all_risk">All Risk</option>
                                            <option value="tlo">TLO</option>
                                            <option value="comprehensive">Comprehensive</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Cost & Payer */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <InputLabel value="Biaya Perpanjangan (Rp)" />
                                    <TextInput
                                        type="number"
                                        value={renewData.cost}
                                        onChange={(e) => setRenewData('cost', e.target.value)}
                                        placeholder="cth: 3500000"
                                        className="w-full text-xs font-mono"
                                    />
                                    <InputError message={renewErrors.cost} />
                                </div>
                                <div className="space-y-1">
                                    <InputLabel value="Dibebankan Kepada" />
                                    <select
                                        value={renewData.payer}
                                        onChange={(e) => setRenewData('payer', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        <option value="tenant">Perusahaan (Rental)</option>
                                        {selectedVehicleForRenew.partner_id && (
                                            <option value="owner">
                                                Pemilik Unit / Investor ({selectedVehicleForRenew.partner?.name})
                                            </option>
                                        )}
                                        <option value="shared">Bagi Bersama</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reference Number & Notes */}
                            <div className="space-y-1">
                                <InputLabel value="Nomor Referensi / Resi / Kwitansi" />
                                <TextInput
                                    value={renewData.reference_number}
                                    onChange={(e) => setRenewData('reference_number', e.target.value)}
                                    placeholder="cth: KW-SAMSAT-9981"
                                    className="w-full text-xs font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <InputLabel value="Catatan Tambahan" />
                                <textarea
                                    value={renewData.notes}
                                    onChange={(e) => setRenewData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="cth: Diurus melalui Biro Jasa Berkah, termasuk biaya gesek nomor mesin..."
                                    className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-normal text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setSelectedVehicleForRenew(null)}
                                className="!rounded-xl text-xs"
                            >
                                Batal
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={renewProcessing}
                                className="!rounded-xl text-xs gap-1.5"
                            >
                                {renewProcessing ? 'Menyimpan...' : 'Simpan Perpanjangan Dokumen'}
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </Modal>
        </DynamicLayout>
    );
}

function matchDocLabel(type: string): string {
    switch (type) {
        case 'stnk_annual':
            return 'Pajak STNK 1 Thn';
        case 'stnk_five_year':
            return 'Plat STNK 5 Thn';
        case 'insurance':
            return 'Asuransi';
        case 'kir':
            return 'Uji KIR';
        default:
            return type;
    }
}

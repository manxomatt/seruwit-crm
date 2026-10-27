import DynamicLayout from '@/Layouts/DynamicLayout';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select, { type SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo, FormEventHandler } from 'react';
import DocumentNav from '../../../../../../../Document/resources/js/DocumentNav';
import FleetNav from '../../../../FleetNav';

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
    const isDocumentContext = isCurrentRoute('documents.compliance.*');

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

    const handleRenewSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedVehicleForRenew) return;

        postRenew(prefixedRoute('fleet.compliance.renew', selectedVehicleForRenew.id), {
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

        router.get(prefixedRoute(isDocumentContext ? 'documents.compliance.index' : 'fleet.compliance.index'), query, {
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-inset ring-amber-600/30 dark:bg-amber-950/60 dark:text-amber-300">
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
                            className="text-[10px] font-bold text-amber-700 hover:underline dark:text-amber-400"
                        >
                            Perbarui →
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col items-start gap-0.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Aktif ({doc.days} hr)</span>
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                    {formatDate(doc.date)}
                </span>
            </div>
        );
    };

    const documentTypeLabels: Record<string, string> = {
        stnk_annual: 'Pajak STNK Tahunan',
        stnk_five_year: 'STNK 5 Tahunan (Plat)',
        insurance: 'Polis Asuransi',
        kir: 'Uji KIR Berkala',
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <PageHeader
                        title="Kepatuhan & Pajak Armada"
                        subtitle="Monitoring jatuh tempo Pajak STNK, STNK 5 Tahunan, Polis Asuransi, dan Uji KIR armada."
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={prefixedRoute('fleet.vehicles.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs shadow-xs">
                                🚗 Daftar Armada
                            </SecondaryButton>
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-black text-white shadow-xs transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                        >
                            <span>🖨️</span>
                            <span>Cetak Laporan</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Kepatuhan & Pajak Armada · Fleet Compliance" />

            {isDocumentContext ? <DocumentNav /> : <FleetNav />}

            <div className="space-y-6">
                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {/* Card 1: Total Monitored */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Unit Terpantau</p>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                🛡️
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                            {kpi.total_monitored} <span className="text-xs font-semibold text-slate-400">Unit</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">Status armada aktif & maintenance</p>
                    </div>

                    {/* Card 2: Expired / Critical */}
                    <div
                        onClick={() => applyFilter({ status: filters.status === 'expired' ? 'all' : 'expired' })}
                        className={`cursor-pointer overflow-hidden rounded-3xl border p-5 shadow-xs transition hover:scale-[1.02] ${
                            filters.status === 'expired'
                                ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 ring-2 ring-rose-500'
                                : 'border-rose-200/80 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                Kadaluarsa (Expired)
                            </p>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
                                ⛔
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-300">
                            {kpi.expired_count} <span className="text-xs font-semibold text-rose-500">Unit</span>
                        </p>
                        <p className="mt-1 text-[11px] text-rose-600/80 dark:text-rose-400">Klaim asuransi berisiko ditolak</p>
                    </div>

                    {/* Card 3: Expiring Soon (H-30) */}
                    <div
                        onClick={() => applyFilter({ status: filters.status === 'expiring_soon' ? 'all' : 'expiring_soon' })}
                        className={`cursor-pointer overflow-hidden rounded-3xl border p-5 shadow-xs transition hover:scale-[1.02] ${
                            filters.status === 'expiring_soon'
                                ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500'
                                : 'border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                                Jatuh Tempo H-30 Hari
                            </p>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                                ⚠️
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-black text-amber-800 dark:text-amber-300">
                            {kpi.expiring_soon_count} <span className="text-xs font-semibold text-amber-600">Unit</span>
                        </p>
                        <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400">Perlu diproses ke Samsat/Biro Jasa</p>
                    </div>

                    {/* Card 4: Compliant / Safe */}
                    <div
                        onClick={() => applyFilter({ status: filters.status === 'safe' ? 'all' : 'safe' })}
                        className={`cursor-pointer overflow-hidden rounded-3xl border p-5 shadow-xs transition hover:scale-[1.02] ${
                            filters.status === 'safe'
                                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500'
                                : 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                                Dokumen Aman & Patuh
                            </p>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                ✅
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-300">
                            {kpi.safe_count} <span className="text-xs font-semibold text-emerald-600">Unit</span>
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400">Masa berlaku aktif &gt; 30 hari</p>
                    </div>
                </div>

                {/* Tab Switcher: Compliance Matrix vs Renewal Logs */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <button
                        type="button"
                        onClick={() => setActiveTab('board')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'board'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span>🛡️ Matriks Kepatuhan Armada</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                            {vehicles.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'history'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span>📜 Riwayat Perpanjangan Dokumen</span>
                        <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">
                            {recentRenewals.length}
                        </span>
                    </button>
                </div>

                {activeTab === 'board' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                                {/* Search */}
                                <div className="relative w-64">
                                    <TextInput
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applyFilter({ search })}
                                        placeholder="Cari plat atau armada..."
                                        className="!py-1.5 text-xs !rounded-xl pl-8 w-full"
                                    />
                                    <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={filters.status}
                                    onChange={(e) => applyFilter({ status: e.target.value })}
                                    className="rounded-xl border-slate-200/80 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="expired">⛔ Kadaluarsa Saja</option>
                                    <option value="expiring_soon">⚠️ Jatuh Tempo H-30 Saja</option>
                                    <option value="safe">✅ Dokumen Aman Saja</option>
                                </select>

                                {/* Base Filter */}
                                <select
                                    value={filters.home_base_id ? String(filters.home_base_id) : ''}
                                    onChange={(e) => applyFilter({ home_base_id: e.target.value ? Number(e.target.value) : null })}
                                    className="rounded-xl border-slate-200/80 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="">Semua Cabang / Base</option>
                                    {bases.map((b) => (
                                        <option key={b.id} value={String(b.id)}>
                                            {b.name} ({b.code})
                                        </option>
                                    ))}
                                </select>

                                {/* Ownership Filter */}
                                <select
                                    value={filters.ownership_type}
                                    onChange={(e) => applyFilter({ ownership_type: e.target.value })}
                                    className="rounded-xl border-slate-200/80 bg-white py-1.5 px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="">Semua Kepemilikan</option>
                                    <option value="owned">🏢 Internal Perusahaan</option>
                                    <option value="investor">🤝 Titipan Investor</option>
                                    <option value="partner_loan">🤝 Sublease Rekanan</option>
                                </select>
                            </div>

                            {(filters.search || filters.status !== 'all' || filters.home_base_id || filters.ownership_type) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilter({ search: '', status: 'all', document: 'all', home_base_id: null, ownership_type: '' });
                                    }}
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Reset Filter
                                </button>
                            )}
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            {vehicles.length === 0 ? (
                                <div className="py-16 text-center">
                                    <span className="text-4xl opacity-40">🛡️</span>
                                    <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Tidak ada kendaraan yang sesuai dengan kriteria filter.
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/70 dark:bg-slate-850 text-slate-400 font-bold">
                                                <th className="px-4 py-3.5">Unit Kendaraan</th>
                                                <th className="px-4 py-3.5">Kepemilikan / Investor</th>
                                                <th className="px-4 py-3.5">Pajak STNK Tahunan</th>
                                                <th className="px-4 py-3.5">STNK 5 Tahunan (Plat)</th>
                                                <th className="px-4 py-3.5">Polis Asuransi</th>
                                                <th className="px-4 py-3.5">Uji KIR Berkala</th>
                                                <th className="px-4 py-3.5 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                            {vehicles.map((v) => {
                                                const s = v.compliance_summary;
                                                return (
                                                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                                        {/* Unit Info */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <Link
                                                                    href={prefixedRoute('fleet.vehicles.show', v.id)}
                                                                    className="font-mono font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                                                                >
                                                                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                                                                        {v.plate_number}
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                                                                {v.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 capitalize">
                                                                {v.type} {v.brand ? `· ${v.brand}` : ''}
                                                                {v.home_base ? ` · 🏢 ${v.home_base.name}` : ''}
                                                            </div>
                                                        </td>

                                                        {/* Ownership */}
                                                        <td className="px-4 py-3.5">
                                                            {v.ownership_type === 'investor' ? (
                                                                <div>
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                                                        🤝 Investor
                                                                    </span>
                                                                    <div className="font-bold text-slate-700 dark:text-slate-300 mt-1">
                                                                        {v.partner?.name ?? '—'}
                                                                    </div>
                                                                </div>
                                                            ) : v.ownership_type === 'partner_loan' ? (
                                                                <div>
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                                                                        🤝 Sublease
                                                                    </span>
                                                                    <div className="font-bold text-slate-700 dark:text-slate-300 mt-1">
                                                                        {v.partner?.name ?? '—'}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                    🏢 Internal
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* STNK Annual */}
                                                        <td className="px-4 py-3.5">
                                                            {renderStatusBadge(s.stnk_annual, () => openRenewModal(v, 'stnk_annual'))}
                                                        </td>

                                                        {/* STNK 5 Years */}
                                                        <td className="px-4 py-3.5">
                                                            {renderStatusBadge(s.stnk_five_year, () => openRenewModal(v, 'stnk_five_year'))}
                                                        </td>

                                                        {/* Insurance */}
                                                        <td className="px-4 py-3.5">
                                                            {renderStatusBadge(s.insurance, () => openRenewModal(v, 'insurance'))}
                                                            {s.insurance.provider && (
                                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                                    {s.insurance.provider} ({s.insurance.type ? s.insurance.type.replace('_', ' ').toUpperCase() : 'Polis'})
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* KIR */}
                                                        <td className="px-4 py-3.5">
                                                            {renderStatusBadge(s.kir, () => openRenewModal(v, 'kir'))}
                                                        </td>

                                                        {/* Action */}
                                                        <td className="px-4 py-3.5 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => openRenewModal(v)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
                                                            >
                                                                <span>📝</span>
                                                                <span>Perbarui</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-100 dark:border-slate-800 p-5">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Riwayat Transaksi Perpanjangan Dokumen Armada
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Catatan audit perpanjangan Pajak, STNK, Asuransi, dan KIR beserta biaya dan pembayar terkait.
                            </p>
                        </div>

                        {recentRenewals.length === 0 ? (
                            <div className="py-16 text-center">
                                <span className="text-4xl opacity-40">📜</span>
                                <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                    Belum ada catatan riwayat perpanjangan dokumen.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50/70 dark:bg-slate-850 text-slate-400 font-bold">
                                            <th className="px-4 py-3.5">Tgl Pelaksanaan</th>
                                            <th className="px-4 py-3.5">Armada</th>
                                            <th className="px-4 py-3.5">Jenis Dokumen</th>
                                            <th className="px-4 py-3.5">Masa Berlaku Baru</th>
                                            <th className="px-4 py-3.5">Biaya Perpanjangan</th>
                                            <th className="px-4 py-3.5">Dibayar Oleh</th>
                                            <th className="px-4 py-3.5">Petugas / No Ref</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                        {recentRenewals.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                                <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                                                    {formatDate(log.renewal_date)}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                        {log.vehicle?.plate_number ?? '—'}
                                                    </span>
                                                    <div className="text-[11px] text-slate-400">
                                                        {log.vehicle?.name}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                                                    {documentTypeLabels[log.document_type] ?? log.document_type}
                                                </td>
                                                <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatDate(log.new_expires_at)}
                                                </td>
                                                <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(Number(log.cost))}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                                        log.payer === 'owner'
                                                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                    }`}>
                                                        {log.payer === 'owner' ? `Investor (${log.partner?.name ?? 'Pemilik'})` : 'Perusahaan (Rental)'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-500">
                                                    <div>{log.creator?.name ?? 'Admin'}</div>
                                                    {log.reference_number && (
                                                        <div className="text-[10px] font-mono text-slate-400">
                                                            Ref: {log.reference_number}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Renewal Modal */}
            <Modal show={Boolean(selectedVehicleForRenew)} onClose={() => setSelectedVehicleForRenew(null)} maxWidth="lg">
                {selectedVehicleForRenew && (
                    <form onSubmit={handleRenewSubmit} className="p-6 space-y-5">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>📝</span>
                                <span>Perbarui Dokumen: {selectedVehicleForRenew.plate_number}</span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {selectedVehicleForRenew.name} ({selectedVehicleForRenew.type}) · {selectedVehicleForRenew.home_base?.name ?? 'Semua Base'}
                            </p>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Document Type */}
                            <div className="space-y-1">
                                <InputLabel value="Jenis Dokumen yang Diperpanjang" />
                                <select
                                    value={renewData.document_type}
                                    onChange={(e) => setRenewData('document_type', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="stnk_annual">Pajak STNK Tahunan</option>
                                    <option value="stnk_five_year">STNK 5 Tahunan (Ganti Plat/Kaleng)</option>
                                    <option value="insurance">Polis Asuransi Kendaraan</option>
                                    <option value="kir">Uji KIR Berkala (Dishub)</option>
                                </select>
                            </div>

                            {/* If Insurance */}
                            {renewData.document_type === 'insurance' && (
                                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-1">
                                        <InputLabel value="Nama Perusahaan Asuransi" />
                                        <TextInput
                                            value={renewData.insurance_provider}
                                            onChange={(e) => setRenewData('insurance_provider', e.target.value)}
                                            placeholder="cth: Asuransi Astra / Garda Oto"
                                            className="w-full text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <InputLabel value="Jenis Perlindungan" />
                                        <select
                                            value={renewData.insurance_type}
                                            onChange={(e) => setRenewData('insurance_type', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                        >
                                            <option value="all_risk">All Risk (Comprehensive)</option>
                                            <option value="tlo">Total Loss Only (TLO)</option>
                                            <option value="comprehensive">Kombinasi</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <InputLabel value="Nomor Polis Asuransi" />
                                        <TextInput
                                            value={renewData.insurance_policy_number}
                                            onChange={(e) => setRenewData('insurance_policy_number', e.target.value)}
                                            placeholder="cth: POL-2026-X8919"
                                            className="w-full text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <InputLabel value="Tanggal Jatuh Tempo Baru *" />
                                    <input
                                        type="date"
                                        value={renewData.new_expires_at}
                                        onChange={(e) => setRenewData('new_expires_at', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                        required
                                    />
                                    <InputError message={renewErrors.new_expires_at} />
                                </div>
                                <div className="space-y-1">
                                    <InputLabel value="Tanggal Pembayaran / Proses *" />
                                    <input
                                        type="date"
                                        value={renewData.renewal_date}
                                        onChange={(e) => setRenewData('renewal_date', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200/80 bg-white py-2 px-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                        required
                                    />
                                    <InputError message={renewErrors.renewal_date} />
                                </div>
                            </div>

                            {/* Cost & Payer */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <InputLabel value="Biaya Perpanjangan (Rp)" />
                                    <TextInput
                                        type="number"
                                        value={renewData.cost}
                                        onChange={(e) => setRenewData('cost', e.target.value)}
                                        placeholder="cth: 3500000"
                                        className="w-full text-xs"
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

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
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

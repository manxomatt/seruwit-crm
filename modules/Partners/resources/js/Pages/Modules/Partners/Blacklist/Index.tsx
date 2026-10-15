import DynamicLayout from '@/Layouts/DynamicLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import PartnersNav from '../../../../PartnersNav';

interface BlacklistItem {
    id: number;
    partner_id: number | null;
    id_number: string;
    phone: string;
    name: string;
    license_number: string | null;
    category: 'car_theft' | 'pawn_attempt' | 'bad_debt' | 'fake_identity' | 'reckless_damage' | 'other';
    severity: 'critical' | 'warning' | 'caution';
    incident_date: string | null;
    incident_details: string;
    police_report_number: string | null;
    is_active: boolean;
    created_at: string;
    partner?: { id: number; code: string; name: string; phone: string | null } | null;
    reporter?: { id: number; name: string } | null;
}

interface Metrics {
    total_cases: number;
    theft_cases: number;
    bad_debt_cases: number;
    active_cases: number;
}

interface Filters {
    search: string;
    category: string;
    severity: string;
    status: string;
}

interface Props {
    blacklists: BlacklistItem[];
    metrics: Metrics;
    filters: Filters;
}

const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
    </svg>
);

const getInitials = (name: string): string => {
    const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
    if (words.length === 0) return '?';
    return words.map((w) => w.charAt(0).toUpperCase()).join('');
};

const AVATAR_COLORS = [
    'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
    'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
];

const getAvatarColor = (id: number, name: string): string => {
    const source = name.length > 0 ? name.charCodeAt(0) + id : id;
    return AVATAR_COLORS[source % AVATAR_COLORS.length];
};

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition data-[focus]:bg-slate-100 dark:data-[focus]:bg-slate-800';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition data-[focus]:bg-rose-50 dark:data-[focus]:bg-rose-900/30';

export default function BlacklistIndex({
    blacklists,
    metrics,
    filters,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(filters.category || 'all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>(filters.severity || 'all');
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'active');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItemForDetail, setSelectedItemForDetail] = useState<BlacklistItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<BlacklistItem | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);

    const hasActiveFilters = Boolean(
        search.trim() || selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedStatus !== 'active'
    );

    const addForm = useForm({
        name: '',
        id_number: '',
        phone: '',
        license_number: '',
        category: 'car_theft',
        severity: 'critical',
        incident_date: new Date().toISOString().slice(0, 10),
        incident_details: '',
        police_report_number: '',
    });

    const applyFilters = (newOverrides: Partial<Filters> = {}) => {
        const query: Record<string, any> = {
            search: (newOverrides.search !== undefined ? newOverrides.search : search).trim() || undefined,
            category: (newOverrides.category !== undefined ? newOverrides.category : selectedCategory) !== 'all'
                ? (newOverrides.category !== undefined ? newOverrides.category : selectedCategory)
                : undefined,
            severity: (newOverrides.severity !== undefined ? newOverrides.severity : selectedSeverity) !== 'all'
                ? (newOverrides.severity !== undefined ? newOverrides.severity : selectedSeverity)
                : undefined,
            status: (newOverrides.status !== undefined ? newOverrides.status : selectedStatus) !== 'all'
                ? (newOverrides.status !== undefined ? newOverrides.status : selectedStatus)
                : undefined,
        };

        Object.keys(query).forEach((key) => query[key] === undefined && delete query[key]);

        router.get(prefixedRoute('partners.blacklist.index'), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('all');
        setSelectedSeverity('all');
        setSelectedStatus('all');
        router.get(prefixedRoute('partners.blacklist.index'), { status: 'all' }, { preserveState: true, replace: true });
    };

    const submitAdd: FormEventHandler = (e) => {
        e.preventDefault();
        addForm.post(prefixedRoute('partners.blacklist.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddModal(false);
                addForm.reset();
            },
        });
    };

    const toggleStatus = (item: BlacklistItem) => {
        const newStatus = !item.is_active;
        const confirmMsg = newStatus
            ? `Aktifkan kembali status blacklist untuk ${item.name}?`
            : `Cabut status blacklist (whitelist) untuk ${item.name}?`;

        if (confirm(confirmMsg)) {
            router.patch(
                prefixedRoute('partners.blacklist.update', item.id),
                { is_active: newStatus },
                { preserveScroll: true }
            );
        }
    };

    const openDeleteDialog = (item: BlacklistItem) => {
        setItemToDelete(item);
    };

    const closeDeleteDialog = () => {
        setItemToDelete(null);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setProcessingDelete(true);
        router.delete(prefixedRoute('partners.blacklist.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessingDelete(false),
        });
    };

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString(localeTag, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const getSeverityBadge = (severity: BlacklistItem['severity']) => {
        switch (severity) {
            case 'critical':
                return {
                    label: 'Tolak Mutlak',
                    icon: '⛔',
                    className: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/40',
                };
            case 'warning':
                return {
                    label: 'Waspada Tinggi',
                    icon: '⚠️',
                    className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/40',
                };
            case 'caution':
                return {
                    label: 'Catatan Khusus',
                    icon: '📝',
                    className: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
                };
        }
    };

    const getCategoryLabel = (category: BlacklistItem['category']) => {
        switch (category) {
            case 'car_theft':
                return 'Penggelapan Armada';
            case 'pawn_attempt':
                return 'Percobaan Gadai';
            case 'bad_debt':
                return 'Gagal Bayar / Kabur';
            case 'fake_identity':
                return 'Identitas Palsu';
            case 'reckless_damage':
                return 'Kecelakaan Menolak Ganti';
            default:
                return 'Pelanggaran Lainnya';
        }
    };

    const statusPills = [
        { value: 'active', label: 'Aktif Dicekal' },
        { value: 'inactive', label: 'Dicabut (Whitelist)' },
        { value: 'all', label: 'Semua Status' },
    ];

    const severityPills = [
        { value: 'all', label: 'Semua Tingkat' },
        { value: 'critical', label: '⛔ Tolak Mutlak' },
        { value: 'warning', label: '⚠️ Waspada' },
        { value: 'caution', label: '📝 Catatan' },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('partners.nav.blacklist', undefined, 'Daftar Hitam & Anti-Fraud')}
                    subtitle={
                        <span className="text-xs text-slate-500">
                            Database pencegahan penggelapan armada, pemalsuan identitas KTP/SIM, dan penunggakan sewa bermasalah.
                        </span>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <PrimaryButton
                                type="button"
                                onClick={() => setShowAddModal(true)}
                                className="!rounded-xl text-xs shadow-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500"
                            >
                                + Tambah Daftar Hitam
                            </PrimaryButton>
                        </div>
                    }
                />
            }
        >
            <Head title="Daftar Hitam Pelanggan & Anti-Fraud" />

            <PartnersNav />

            {flash?.success && (
                <div className="mb-6 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span>{flash.success}</span>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">✕</span>
                        <span>{flash.error}</span>
                    </div>
                </div>
            )}

            {/* KPI Metrics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Total */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xl">📋</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Total Kasus
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            {metrics.total_cases}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Riwayat Kasus Terdata
                        </p>
                    </div>
                </div>

                {/* Card 2: Theft Cases */}
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 sm:p-5 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xl">🚨</span>
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                            Bahaya Fatal
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-rose-700 dark:text-rose-400">
                            {metrics.theft_cases}
                        </p>
                        <p className="mt-0.5 text-xs text-rose-600/90 dark:text-rose-400/80">
                            Penggelapan & Gadai Gelap
                        </p>
                    </div>
                </div>

                {/* Card 3: Bad Debt */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xl">💸</span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            Finansial
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-amber-700 dark:text-amber-400">
                            {metrics.bad_debt_cases}
                        </p>
                        <p className="mt-0.5 text-xs text-amber-600/90 dark:text-amber-400/80">
                            Kasus Gagal Bayar / Kabur
                        </p>
                    </div>
                </div>

                {/* Card 4: Active Blacklists */}
                <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 sm:p-5 shadow-xs dark:border-indigo-900/60 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xl">🔒</span>
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                            Cekal Aktif
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-indigo-700 dark:text-indigo-400">
                            {metrics.active_cases}
                        </p>
                        <p className="mt-0.5 text-xs text-indigo-600/90 dark:text-indigo-400/80">
                            Identitas Terkunci dari Sewa
                        </p>
                    </div>
                </div>
            </div>

            {/* Unified Data Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                {/* Search & Filter Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[200px] flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                    <SearchIcon />
                                </span>
                                <TextInput
                                    type="search"
                                    placeholder="Cari nama, NIK KTP, no telepon, no laporan polisi, kronologi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full !rounded-xl border-slate-200 dark:border-slate-800 !py-2 pl-9 text-xs bg-white dark:bg-slate-900"
                                />
                            </div>

                            <div className="w-56 shrink-0 sm:w-64">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        applyFilters({ category: e.target.value });
                                    }}
                                    className="w-full !rounded-xl border-slate-200 dark:border-slate-800 !py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-indigo-500 shadow-xs"
                                >
                                    <option value="all">Semua Kategori Kasus</option>
                                    <option value="car_theft">Penggelapan Armada</option>
                                    <option value="pawn_attempt">Percobaan Gadai</option>
                                    <option value="bad_debt">Gagal Bayar / Kabur</option>
                                    <option value="fake_identity">Identitas Palsu</option>
                                    <option value="reckless_damage">Kecelakaan Menolak Ganti</option>
                                    <option value="other">Pelanggaran Lainnya</option>
                                </select>
                            </div>

                            <PrimaryButton
                                type="submit"
                                className="!rounded-xl text-xs shadow-sm"
                            >
                                {t('common.search', undefined, 'Cari')}
                            </PrimaryButton>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition"
                                >
                                    <CloseIcon />
                                    <span>Bersihkan Filter</span>
                                </button>
                            )}
                        </form>

                        {/* Pills Filter Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {statusPills.map((pill) => {
                                const active = selectedStatus === pill.value;
                                return (
                                    <button
                                        key={`status-${pill.value}`}
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus(pill.value);
                                            applyFilters({ status: pill.value });
                                        }}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${active
                                            ? pill.value === 'active'
                                                ? 'bg-rose-600 text-white shadow-sm'
                                                : pill.value === 'inactive'
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {pill.label}
                                    </button>
                                );
                            })}

                            <span className="mx-1 hidden h-4 w-px bg-slate-200 dark:bg-slate-800 sm:inline-block" aria-hidden />

                            {severityPills.map((pill) => {
                                const active = selectedSeverity === pill.value;
                                return (
                                    <button
                                        key={`severity-${pill.value}`}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSeverity(pill.value);
                                            applyFilters({ severity: pill.value });
                                        }}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${active
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {pill.label}
                                    </button>
                                );
                            })}

                            <span className="ml-auto text-xs font-bold tabular-nums text-slate-400">
                                Menampilkan {blacklists.length} kasus
                            </span>
                        </div>
                    </div>
                </div>

                {/* Table or Empty State */}
                {blacklists.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 text-2xl font-bold">
                            🛡️
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                            {hasActiveFilters ? 'Tidak Ditemukan Kasus yang Sesuai' : 'Belum Ada Daftar Hitam'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                            {hasActiveFilters
                                ? 'Coba sesuaikan filter atau kata kunci pencarian Anda untuk melihat data lainnya.'
                                : 'Database daftar hitam pelanggan bermasalah masih kosong. Tambahkan data untuk mencegah risiko penggelapan armada.'}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                <CloseIcon />
                                <span>Bersihkan Filter</span>
                            </button>
                        ) : (
                            <div className="mt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition"
                                >
                                    <span>+</span>
                                    <span>Tambah Catatan Kasus Pertama</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                        Identitas Pelaku
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                        Kontak & Profil
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                        Tingkat Risiko & Modus
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                        Kronologi & Bukti
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                        Status
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold text-slate-500 dark:text-slate-400">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {blacklists.map((item) => {
                                    const sevBadge = getSeverityBadge(item.severity);
                                    const phoneClean = item.phone.replace(/[^0-9]/g, '');
                                    const avatarCls = getAvatarColor(item.id, item.name);

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                                                !item.is_active ? 'opacity-65' : ''
                                            }`}
                                        >
                                            {/* Column 1: Identitas */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${avatarCls}`}
                                                    >
                                                        {getInitials(item.name)}
                                                    </div>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedItemForDetail(item)}
                                                            className="text-left font-bold text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 transition"
                                                        >
                                                            {item.name}
                                                        </button>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                                                NIK: {item.id_number}
                                                            </span>
                                                            {item.license_number && (
                                                                <span>SIM: {item.license_number}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Kontak & Mitra */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            {item.phone}
                                                        </span>
                                                        {phoneClean && (
                                                            <a
                                                                href={`https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Hubungi via WhatsApp"
                                                                className="inline-flex items-center justify-center rounded-lg bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                            >
                                                                WA 💬
                                                            </a>
                                                        )}
                                                    </div>
                                                    {item.partner ? (
                                                        <div>
                                                            <Link
                                                                href={prefixedRoute('partners.show', item.partner.id)}
                                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                                            >
                                                                <span>Mitra:</span>
                                                                <span>{item.partner.name}</span>
                                                                <span className="font-mono text-[10px]">({item.partner.code})</span>
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">Tanpa tautan profil</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 3: Severity & Kategori */}
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sevBadge.className}`}
                                                    >
                                                        <span>{sevBadge.icon}</span>
                                                        <span>{sevBadge.label}</span>
                                                    </span>
                                                    <div className="mt-1">
                                                        <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                                            {getCategoryLabel(item.category)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 4: Kronologi & Bukti */}
                                            <td className="px-6 py-4 max-w-xs">
                                                <div>
                                                    <p
                                                        onClick={() => setSelectedItemForDetail(item)}
                                                        className="line-clamp-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                                                        title={item.incident_details}
                                                    >
                                                        {item.incident_details}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                                        {item.incident_date && (
                                                            <span>Tgl: {formatDate(item.incident_date)}</span>
                                                        )}
                                                        {item.police_report_number && (
                                                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                                                                LP: {item.police_report_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 5: Status */}
                                            <td className="px-6 py-4">
                                                {item.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse" />
                                                        Aktif Dicekal
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Dicabut (Whitelist)
                                                    </span>
                                                )}
                                            </td>

                                            {/* Column 6: Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <Menu as="div" className="relative inline-block text-left">
                                                    <MenuButton className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition">
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        className="absolute right-0 z-20 mt-1 w-52 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl transition focus:outline-hidden"
                                                    >
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedItemForDetail(item)}
                                                                className={menuItemClassName}
                                                            >
                                                                <EyeIcon />
                                                                <span>Lihat Detail Lengkap</span>
                                                            </button>
                                                        </MenuItem>

                                                        {phoneClean && (
                                                            <MenuItem>
                                                                <a
                                                                    href={`https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={menuItemClassName}
                                                                >
                                                                    <span>💬 Hubungi via WA</span>
                                                                </a>
                                                            </MenuItem>
                                                        )}

                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleStatus(item)}
                                                                className={menuItemClassName}
                                                            >
                                                                <span>{item.is_active ? '🔓 Cabut Cekal (Whitelist)' : '🔒 Aktifkan Kembali Cekal'}</span>
                                                            </button>
                                                        </MenuItem>

                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(item)}
                                                                className={menuItemDangerClassName}
                                                            >
                                                                <TrashIcon />
                                                                <span>Hapus Catatan</span>
                                                            </button>
                                                        </MenuItem>
                                                    </MenuItems>
                                                </Menu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItemForDetail && (
                <Modal show={Boolean(selectedItemForDetail)} onClose={() => setSelectedItemForDetail(null)} maxWidth="lg">
                    <div className="p-6 space-y-5">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        {selectedItemForDetail.name}
                                    </h3>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                            getSeverityBadge(selectedItemForDetail.severity).className
                                        }`}
                                    >
                                        <span>{getSeverityBadge(selectedItemForDetail.severity).icon}</span>
                                        <span>{getSeverityBadge(selectedItemForDetail.severity).label}</span>
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Kategori: <strong className="text-slate-700 dark:text-slate-300">{getCategoryLabel(selectedItemForDetail.category)}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedItemForDetail(null)}
                                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Identity Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="font-semibold text-slate-400">Nomor Identitas (NIK KTP):</span>
                                <p className="mt-1 font-mono font-bold text-rose-600 dark:text-rose-400">
                                    {selectedItemForDetail.id_number}
                                </p>
                                {selectedItemForDetail.license_number && (
                                    <div className="mt-2">
                                        <span className="font-semibold text-slate-400">Nomor SIM:</span>
                                        <p className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">
                                            {selectedItemForDetail.license_number}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="font-semibold text-slate-400">Kontak WhatsApp / Telepon:</span>
                                <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
                                    {selectedItemForDetail.phone}
                                </p>
                                <div className="mt-2">
                                    <span className="font-semibold text-slate-400">Status Cekal Saat Ini:</span>
                                    <p className="mt-0.5">
                                        {selectedItemForDetail.is_active ? (
                                            <span className="font-bold text-rose-600">🔴 Aktif Dicekal dari Rental</span>
                                        ) : (
                                            <span className="font-bold text-emerald-600">🟢 Dicabut (Whitelist)</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chronology & Incident Details */}
                        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 text-xs dark:border-rose-950/40 dark:bg-rose-950/10">
                            <div className="flex items-center justify-between font-semibold text-slate-500 mb-2">
                                <span>Kronologi & Modus Kejadian:</span>
                                {selectedItemForDetail.incident_date && (
                                    <span>Tgl Kejadian: {formatDate(selectedItemForDetail.incident_date)}</span>
                                )}
                            </div>
                            <p className="whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
                                {selectedItemForDetail.incident_details}
                            </p>
                            {selectedItemForDetail.police_report_number && (
                                <div className="mt-3 pt-2 border-t border-rose-200/50 dark:border-rose-900/40 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                    <strong>No. Laporan Polisi (LP):</strong> {selectedItemForDetail.police_report_number}
                                </div>
                            )}
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                            <span>
                                Dicatat pada {formatDate(selectedItemForDetail.created_at)}
                                {selectedItemForDetail.reporter ? ` oleh ${selectedItemForDetail.reporter.name}` : ''}
                            </span>
                            {selectedItemForDetail.partner && (
                                <Link
                                    href={prefixedRoute('partners.show', selectedItemForDetail.partner.id)}
                                    className="font-bold text-indigo-600 underline dark:text-indigo-400"
                                >
                                    Buka Profil Mitra ({selectedItemForDetail.partner.code})
                                </Link>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    const item = selectedItemForDetail;
                                    setSelectedItemForDetail(null);
                                    toggleStatus(item);
                                }}
                                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                                    selectedItemForDetail.is_active
                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                        : 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs'
                                }`}
                            >
                                {selectedItemForDetail.is_active ? 'Cabut Status Blacklist' : 'Aktifkan Kembali Cekal'}
                            </button>
                            <SecondaryButton type="button" onClick={() => setSelectedItemForDetail(null)}>
                                Tutup
                            </SecondaryButton>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add Blacklist Modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="lg">
                <form onSubmit={submitAdd} className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="text-xl">🚨</span>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                Masukkan Data ke Daftar Hitam (Blacklist)
                            </h3>
                            <p className="text-xs text-slate-400">
                                Mencegah identitas pelaku agar tidak dapat menyewa unit rental kembali.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <InputLabel value="Nama Lengkap Terduga / Pelaku *" />
                            <TextInput
                                type="text"
                                value={addForm.data.name}
                                onChange={(e) => addForm.setData('name', e.target.value)}
                                placeholder="Nama sesuai KTP"
                                className="mt-1 w-full text-xs !rounded-xl"
                                required
                            />
                            <InputError message={addForm.errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Nomor KTP / NIK / Paspor *" />
                            <TextInput
                                type="text"
                                value={addForm.data.id_number}
                                onChange={(e) => addForm.setData('id_number', e.target.value)}
                                placeholder="Contoh: 3578210000000001"
                                className="mt-1 w-full text-xs font-mono !rounded-xl"
                                required
                            />
                            <InputError message={addForm.errors.id_number} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Nomor Telepon / WhatsApp *" />
                            <TextInput
                                type="text"
                                value={addForm.data.phone}
                                onChange={(e) => addForm.setData('phone', e.target.value)}
                                placeholder="Contoh: 08123456789"
                                className="mt-1 w-full text-xs font-mono !rounded-xl"
                                required
                            />
                            <InputError message={addForm.errors.phone} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Nomor SIM (Opsional)" />
                            <TextInput
                                type="text"
                                value={addForm.data.license_number}
                                onChange={(e) => addForm.setData('license_number', e.target.value)}
                                placeholder="Nomor SIM A / B1"
                                className="mt-1 w-full text-xs font-mono !rounded-xl"
                            />
                        </div>

                        <div>
                            <InputLabel value="Kategori Kasus *" />
                            <select
                                value={addForm.data.category}
                                onChange={(e) => addForm.setData('category', e.target.value as any)}
                                className="mt-1 w-full rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="car_theft">Penggelapan Armada</option>
                                <option value="pawn_attempt">Percobaan Gadai Tanpa Izin</option>
                                <option value="bad_debt">Gagal Bayar / Kabur Tanpa Pelunasan</option>
                                <option value="fake_identity">Pemalsuan Dokumen Identitas</option>
                                <option value="reckless_damage">Kecelakaan / Rusak Berat Menolak Ganti</option>
                                <option value="other">Pelanggaran Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <InputLabel value="Tingkat Bahaya (Severity) *" />
                            <select
                                value={addForm.data.severity}
                                onChange={(e) => addForm.setData('severity', e.target.value as any)}
                                className="mt-1 w-full rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="critical">⛔ Tolak Mutlak (Critical Danger)</option>
                                <option value="warning">⚠️ Waspada (Perlu Jaminan Ekstra)</option>
                                <option value="caution">📝 Catatan Kasus Khusus</option>
                            </select>
                        </div>

                        <div>
                            <InputLabel value="Tanggal Kejadian" />
                            <TextInput
                                type="date"
                                value={addForm.data.incident_date}
                                onChange={(e) => addForm.setData('incident_date', e.target.value)}
                                className="mt-1 w-full text-xs !rounded-xl"
                            />
                        </div>

                        <div>
                            <InputLabel value="Nomor Laporan Polisi / LP (Opsional)" />
                            <TextInput
                                type="text"
                                value={addForm.data.police_report_number}
                                onChange={(e) => addForm.setData('police_report_number', e.target.value)}
                                placeholder="Contoh: LP/B/123/X/2026/SPKT"
                                className="mt-1 w-full text-xs !rounded-xl"
                            />
                        </div>
                    </div>

                    <div>
                        <InputLabel value="Kronologi & Modus Kejadian *" />
                        <textarea
                            value={addForm.data.incident_details}
                            onChange={(e) => addForm.setData('incident_details', e.target.value)}
                            placeholder="Jelaskan kronologi kejadian, modus yang digunakan, ciri-ciri pelaku, dan nomor plat mobil yang sempat dibawa..."
                            rows={4}
                            className="mt-1 w-full rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            required
                        />
                        <InputError message={addForm.errors.incident_details} className="mt-1" />
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowAddModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={addForm.processing} className="bg-rose-600 hover:bg-rose-700">
                            {addForm.processing ? 'Menyimpan...' : 'Simpan & Aktifkan Daftar Hitam'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Confirm Delete Dialog */}
            <ConfirmDeleteDialog
                show={Boolean(itemToDelete)}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processingDelete}
                title="Hapus Catatan Daftar Hitam"
                message={
                    itemToDelete
                        ? `Apakah Anda yakin ingin menghapus permanen catatan daftar hitam untuk ${itemToDelete.name} (NIK: ${itemToDelete.id_number})? Tindakan ini tidak dapat dibatalkan.`
                        : 'Apakah Anda yakin ingin menghapus catatan daftar hitam ini?'
                }
            />
        </DynamicLayout>
    );
}

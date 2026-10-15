import DynamicLayout from '@/Layouts/DynamicLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
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
    is_shared_with_community?: boolean;
    share_anonymously?: boolean;
    created_at: string;
    partner?: { id: number; code: string; name: string; phone: string | null } | null;
    reporter?: { id: number; name: string } | null;
}

interface CommunityBlacklistItem {
    id: number;
    name: string;
    id_number: string;
    phone: string;
    license_number: string | null;
    category: 'car_theft' | 'pawn_attempt' | 'bad_debt' | 'fake_identity' | 'reckless_damage' | 'other';
    category_label: string;
    severity: 'critical' | 'warning' | 'caution';
    incident_date: string | null;
    incident_details: string;
    police_report_number: string | null;
    reporter_display: string;
    is_own_tenant: boolean;
    created_at: string;
}

interface Metrics {
    total_cases: number;
    theft_cases: number;
    bad_debt_cases: number;
    active_cases: number;
    community_total_cases?: number;
    my_shared_cases?: number;
}

interface Filters {
    search: string;
    category: string;
    severity: string;
    status: string;
    tab?: string;
}

interface Props {
    tab?: string;
    blacklists: BlacklistItem[];
    community_blacklists?: CommunityBlacklistItem[];
    metrics: Metrics;
    filters: Filters;
    current_tenant_id?: string | null;
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
    tab = 'local',
    blacklists,
    community_blacklists = [],
    metrics,
    filters,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;

    const [activeTab, setActiveTab] = useState<'local' | 'community'>((filters.tab as any) || tab || 'local');
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(filters.category || 'all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>(filters.severity || 'all');
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'active');

    // Modals
    const [selectedItemForDetail, setSelectedItemForDetail] = useState<BlacklistItem | CommunityBlacklistItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<BlacklistItem | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const [processingImportId, setProcessingImportId] = useState<number | null>(null);

    const hasActiveFilters = Boolean(
        search.trim() || selectedCategory !== 'all' || selectedSeverity !== 'all' || (activeTab === 'local' && selectedStatus !== 'active')
    );

    const applyFilters = (newOverrides: Partial<Filters> = {}) => {
        const query: Record<string, any> = {
            tab: newOverrides.tab !== undefined ? newOverrides.tab : activeTab,
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

    const handleTabChange = (newTab: 'local' | 'community') => {
        setActiveTab(newTab);
        applyFilters({ tab: newTab });
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
        router.get(prefixedRoute('partners.blacklist.index'), { tab: activeTab, status: 'all' }, { preserveState: true, replace: true });
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

    const toggleCommunityShare = (item: BlacklistItem) => {
        const newShare = !item.is_shared_with_community;
        const msg = newShare
            ? `Bagikan kasus ${item.name} ke Jaringan Komunitas Rental Seruwit? Data NIK/HP akan membantu sesama pengusaha rental mencegah penggelapan armada.`
            : `Hentikan pembagian kasus ${item.name} dari Jaringan Komunitas Seruwit?`;

        if (confirm(msg)) {
            router.patch(
                prefixedRoute('partners.blacklist.update', item.id),
                { is_shared_with_community: newShare },
                { preserveScroll: true }
            );
        }
    };

    const importFromCommunity = (item: CommunityBlacklistItem) => {
        if (confirm(`Salin catatan ${item.name} (${item.id_number}) ke Blacklist Internal Anda?`)) {
            setProcessingImportId(item.id);
            router.post(
                prefixedRoute('partners.blacklist.import_community', item.id),
                {},
                {
                    preserveScroll: true,
                    onFinish: () => setProcessingImportId(null),
                }
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

    const getSeverityBadge = (severity: 'critical' | 'warning' | 'caution') => {
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

    const getCategoryLabel = (category: string) => {
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

    const CATEGORY_OPTIONS = [
        { value: 'all', label: 'Semua Kategori Kasus' },
        { value: 'car_theft', label: 'Penggelapan Armada' },
        { value: 'pawn_attempt', label: 'Percobaan Gadai' },
        { value: 'bad_debt', label: 'Gagal Bayar / Kabur' },
        { value: 'fake_identity', label: 'Identitas Palsu' },
        { value: 'reckless_damage', label: 'Kecelakaan Menolak Ganti' },
        { value: 'other', label: 'Pelanggaran Lainnya' },
    ];

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
                            <Link href={prefixedRoute('partners.blacklist.create')}>
                                <PrimaryButton
                                    type="button"
                                    className="!rounded-xl text-xs shadow-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500"
                                >
                                    + Tambah Daftar Hitam
                                </PrimaryButton>
                            </Link>
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
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Card 1: Total Local */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-lg">📋</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Kasus Internal
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {metrics.total_cases}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            Catatan Lokal Anda
                        </p>
                    </div>
                </div>

                {/* Card 2: Theft Cases */}
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-lg">🚨</span>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                            Bahaya Fatal
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <p className="text-xl sm:text-2xl font-black tracking-tight text-rose-700 dark:text-rose-400">
                            {metrics.theft_cases}
                        </p>
                        <p className="mt-0.5 text-[11px] text-rose-600/90 dark:text-rose-400/80 truncate">
                            Penggelapan & Gadai
                        </p>
                    </div>
                </div>

                {/* Card 3: Bad Debt */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-lg">💸</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            Finansial
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <p className="text-xl sm:text-2xl font-black tracking-tight text-amber-700 dark:text-amber-400">
                            {metrics.bad_debt_cases}
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-600/90 dark:text-amber-400/80 truncate">
                            Gagal Bayar / Kabur
                        </p>
                    </div>
                </div>

                {/* Card 4: Active Cekal */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-lg">🔒</span>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                            Cekal Aktif
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <p className="text-xl sm:text-2xl font-black tracking-tight text-indigo-700 dark:text-indigo-400">
                            {metrics.active_cases}
                        </p>
                        <p className="mt-0.5 text-[11px] text-indigo-600/90 dark:text-indigo-400/80 truncate">
                            Terkunci dari Sewa
                        </p>
                    </div>
                </div>

                {/* Card 5: Jaringan Komunitas */}
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/40 p-4 shadow-xs dark:border-indigo-900/70 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-lg">🌐</span>
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Lintas Rental
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <p className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-300">
                            {metrics.community_total_cases ?? 0}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            Intelijen Komunitas Seruwit
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleTabChange('local')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'local'
                                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                    >
                        <span>📁 Blacklist Internal Saya</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                            activeTab === 'local' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                            {blacklists.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange('community')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            activeTab === 'community'
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                : 'text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300'
                        }`}
                    >
                        <span>🌐 Jaringan Komunitas Seruwit</span>
                        <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                            {metrics.community_total_cases ?? community_blacklists.length} Kasus
                        </span>
                    </button>
                </div>

                {activeTab === 'community' && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        ⚡ Real-time sinkronisasi pencegahan penggelapan antar rental se-Indonesia
                    </span>
                )}
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
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={
                                        activeTab === 'community'
                                            ? 'Cari NIK KTP, No. HP, nama pelaku, atau nomor plat di seluruh jaringan rental...'
                                            : 'Cari nama pelanggan, NIK, No. HP, atau No. LP...'
                                    }
                                    className="w-full !rounded-xl border-slate-200 pl-9 text-xs dark:border-slate-800"
                                />
                            </div>

                            <div className="w-56 shrink-0 sm:w-64">
                                <Select
                                    className="w-full !py-1 text-xs !rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                    value={selectedCategory}
                                    onChange={(value) => {
                                        setSelectedCategory(value);
                                        applyFilters({ category: value });
                                    }}
                                    placeholder="Semua Kategori Kasus"
                                    options={CATEGORY_OPTIONS}
                                />
                            </div>

                            <PrimaryButton
                                type="submit"
                                className="!rounded-xl px-4 py-2 text-xs shadow-xs"
                            >
                                Cari
                            </PrimaryButton>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <CloseIcon />
                                    <span>Reset</span>
                                </button>
                            )}
                        </form>

                        {/* Filter Badges Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-50 dark:border-slate-800/60">
                            {activeTab === 'local' ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-slate-400 font-semibold mr-1">Status Cekal:</span>
                                    {statusPills.map((pill) => (
                                        <button
                                            key={pill.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedStatus(pill.value);
                                                applyFilters({ status: pill.value });
                                            }}
                                            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                                                selectedStatus === pill.value
                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            {pill.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium">
                                    <span>🌐 Sumber: Seluruh Mitra Rental Terverifikasi Seruwit</span>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-slate-400 font-semibold mr-1">Tingkat Risiko:</span>
                                {severityPills.map((pill) => (
                                    <button
                                        key={pill.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSeverity(pill.value);
                                            applyFilters({ severity: pill.value });
                                        }}
                                        className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                                            selectedSeverity === pill.value
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {pill.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab 1: Local Blacklist Table */}
                {activeTab === 'local' && (
                    <>
                        {blacklists.length === 0 ? (
                            <div className="py-16 text-center">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/40">
                                    🛡️
                                </span>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                                    {hasActiveFilters ? 'Tidak ada data yang sesuai filter' : 'Belum Ada Daftar Hitam Internal'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                                    {hasActiveFilters
                                        ? 'Coba ubah kata kunci pencarian atau sesuaikan opsi kategori kasus.'
                                        : 'Tambahkan data pelanggan yang pernah bermasalah, menolak bayar, atau terindikasi penggelapan armada.'}
                                </p>
                                {hasActiveFilters ? (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        Bersihkan Filter
                                    </button>
                                ) : (
                                    <div className="mt-5">
                                        <Link
                                            href={prefixedRoute('partners.blacklist.create')}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition"
                                        >
                                            <span>+</span>
                                            <span>Tambah Catatan Kasus Pertama</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto min-h-[320px]">
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
                                                Status & Jaringan
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
                                                    {/* Pelaku */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${avatarCls}`}>
                                                                {getInitials(item.name)}
                                                            </div>
                                                            <div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedItemForDetail(item)}
                                                                    className="font-bold text-slate-900 dark:text-white hover:text-rose-600 text-left transition"
                                                                >
                                                                    {item.name}
                                                                </button>
                                                                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                                    NIK: {item.id_number}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Kontak & Profil */}
                                                    <td className="px-6 py-4">
                                                        <p className="font-mono text-slate-700 dark:text-slate-300">
                                                            {item.phone}
                                                        </p>
                                                        {item.partner ? (
                                                            <Link
                                                                href={prefixedRoute('partners.show', item.partner.id)}
                                                                className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                                            >
                                                                <span>Mitra: {item.partner.code}</span>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400">Bukan mitra tetap</span>
                                                        )}
                                                    </td>

                                                    {/* Kategori & Severity */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${sevBadge.className}`}
                                                            >
                                                                <span>{sevBadge.icon}</span>
                                                                <span>{sevBadge.label}</span>
                                                            </span>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                                                                {getCategoryLabel(item.category)}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Kronologi */}
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <p className="line-clamp-2 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                                            {item.incident_details}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                                                            <span>Tgl: {formatDate(item.incident_date)}</span>
                                                            {item.police_report_number && (
                                                                <span className="font-mono text-rose-600 dark:text-rose-400">
                                                                    • LP: {item.police_report_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status & Komunitas */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            {item.is_active ? (
                                                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300">
                                                                    ● Dicekal
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    Whitelist
                                                                </span>
                                                            )}

                                                            <div>
                                                                {item.is_shared_with_community ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-950 dark:text-indigo-300">
                                                                        🌐 Dibagikan
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 block">
                                                                        Hanya Internal
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Aksi */}
                                                    <td className="px-6 py-4 text-right">
                                                        <Menu as="div" className="relative inline-block text-left">
                                                            <MenuButton className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition">
                                                                <EllipsisVerticalIcon />
                                                            </MenuButton>

                                                            <MenuItems
                                                                transition
                                                                anchor="bottom end"
                                                                className="z-[1200] w-56 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xl backdrop-blur-md outline-none"
                                                            >
                                                                <MenuItem>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedItemForDetail(item)}
                                                                        className={menuItemClassName}
                                                                    >
                                                                        <EyeIcon />
                                                                        <span>Lihat Detail Kasus</span>
                                                                    </button>
                                                                </MenuItem>

                                                                <MenuItem>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleCommunityShare(item)}
                                                                        className={menuItemClassName}
                                                                    >
                                                                        <span>
                                                                            {item.is_shared_with_community
                                                                                ? '🚫 Hentikan Berbagi Komunitas'
                                                                                : '🌐 Bagikan ke Komunitas Rental'}
                                                                        </span>
                                                                    </button>
                                                                </MenuItem>

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
                    </>
                )}

                {/* Tab 2: Community Shared Blacklist Table */}
                {activeTab === 'community' && (
                    <>
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100/60 dark:border-indigo-950/40 p-4 sm:p-5 flex items-start gap-3">
                            <span className="text-2xl shrink-0">🌐</span>
                            <div className="text-xs">
                                <h4 className="font-bold text-slate-900 dark:text-white">
                                    Jaringan Intelijen Anti-Penggelapan Lintas Rental (Seruwit Network)
                                </h4>
                                <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    Database ini berisi daftar hitam yang dilaporkan oleh sesama pemilik rental di ekosistem Seruwit. Jika menemukan pelaku yang berpotensi menyewa di rental Anda, klik <strong>"Salin ke Blacklist Saya"</strong> untuk langsung memasukkannya ke proteksi internal.
                                </p>
                            </div>
                        </div>

                        {community_blacklists.length === 0 ? (
                            <div className="py-16 text-center">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl dark:bg-indigo-950/40">
                                    🔍
                                </span>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                                    Tidak Ditemukan Laporan Komunitas yang Cocok
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                                    Belum ada catatan yang sesuai dengan filter atau kata kunci pencarian Anda di jaringan nasional.
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                                    >
                                        Bersihkan Filter
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto min-h-[320px]">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                                Identitas Terduga Pelaku
                                            </th>
                                            <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                                Kontak & SIM
                                            </th>
                                            <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                                Kategori Kasus
                                            </th>
                                            <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                                Modus / No. Laporan Polisi
                                            </th>
                                            <th className="px-6 py-3.5 text-left font-bold text-slate-500 dark:text-slate-400">
                                                Pelapor
                                            </th>
                                            <th className="px-6 py-3.5 text-right font-bold text-slate-500 dark:text-slate-400">
                                                Aksi Proteksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {community_blacklists.map((citem) => {
                                            const sevBadge = getSeverityBadge(citem.severity);
                                            const avatarCls = getAvatarColor(citem.id, citem.name);

                                            return (
                                                <tr
                                                    key={citem.id}
                                                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                                                >
                                                    {/* Pelaku */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${avatarCls}`}>
                                                                {getInitials(citem.name)}
                                                            </div>
                                                            <div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedItemForDetail(citem)}
                                                                    className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 text-left transition"
                                                                >
                                                                    {citem.name}
                                                                </button>
                                                                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                                    NIK: {citem.id_number}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Kontak & SIM */}
                                                    <td className="px-6 py-4">
                                                        <p className="font-mono text-slate-700 dark:text-slate-300">
                                                            {citem.phone}
                                                        </p>
                                                        {citem.license_number && (
                                                            <p className="font-mono text-[11px] text-slate-400">
                                                                SIM: {citem.license_number}
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Kategori & Severity */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${sevBadge.className}`}
                                                            >
                                                                <span>{sevBadge.icon}</span>
                                                                <span>{sevBadge.label}</span>
                                                            </span>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                                                                {citem.category_label || getCategoryLabel(citem.category)}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Modus & No LP */}
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <p className="line-clamp-2 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                                                            {citem.incident_details}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                                                            <span>Tgl: {formatDate(citem.incident_date)}</span>
                                                            {citem.police_report_number && (
                                                                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                                                                    • LP: {citem.police_report_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Pelapor */}
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                                                🏢 {citem.reporter_display}
                                                            </span>
                                                            {citem.is_own_tenant && (
                                                                <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                    (Laporan Rental Anda)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Aksi Proteksi */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedItemForDetail(citem)}
                                                                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                                                            >
                                                                Detail
                                                            </button>

                                                            {!citem.is_own_tenant && (
                                                                <button
                                                                    type="button"
                                                                    disabled={processingImportId === citem.id}
                                                                    onClick={() => importFromCommunity(citem)}
                                                                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
                                                                >
                                                                    <span>+</span>
                                                                    <span>{processingImportId === citem.id ? 'Menyalin...' : 'Salin ke Blacklist'}</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
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
                                    <span className="font-semibold text-slate-400">Status Sumber:</span>
                                    <p className="mt-0.5">
                                        {'reporter_display' in selectedItemForDetail ? (
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                🌐 Komunitas: {selectedItemForDetail.reporter_display}
                                            </span>
                                        ) : (
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                📁 Blacklist Internal Anda
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chronology & Incident Details */}
                        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 text-xs dark:border-rose-950/40 dark:bg-rose-950/10">
                            <div className="flex items-center justify-between font-semibold text-slate-500 mb-2">
                                <span>Kronologi & Modus Kejadian:</span>
                                <span>Tanggal: {formatDate(selectedItemForDetail.incident_date)}</span>
                            </div>
                            <p className="whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                                {selectedItemForDetail.incident_details}
                            </p>
                        </div>

                        {/* Legal Report Number */}
                        {selectedItemForDetail.police_report_number && (
                            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/20">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">👮‍♂️</span>
                                    <div>
                                        <span className="font-bold text-amber-900 dark:text-amber-200">
                                            Nomor Laporan Polisi (LP):
                                        </span>
                                        <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                                            {selectedItemForDetail.police_report_number}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {'reporter_display' in selectedItemForDetail && !selectedItemForDetail.is_own_tenant && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const citem = selectedItemForDetail as CommunityBlacklistItem;
                                        setSelectedItemForDetail(null);
                                        importFromCommunity(citem);
                                    }}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
                                >
                                    + Salin ke Blacklist Internal Saya
                                </button>
                            )}
                            <SecondaryButton
                                type="button"
                                onClick={() => setSelectedItemForDetail(null)}
                                className="!rounded-xl text-xs"
                            >
                                Tutup
                            </SecondaryButton>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDeleteDialog
                isOpen={Boolean(itemToDelete)}
                title="Hapus Catatan Daftar Hitam?"
                message={
                    itemToDelete
                        ? `Apakah Anda yakin ingin menghapus catatan daftar hitam untuk ${itemToDelete.name} (${itemToDelete.id_number})? Data riwayat kasus ini akan dihapus permanen.`
                        : ''
                }
                onConfirm={confirmDelete}
                onClose={closeDeleteDialog}
                processing={processingDelete}
            />
        </DynamicLayout>
    );
}

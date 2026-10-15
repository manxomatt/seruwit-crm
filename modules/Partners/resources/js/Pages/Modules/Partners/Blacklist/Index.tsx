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
import { useState, useMemo, FormEventHandler } from 'react';
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

export default function BlacklistIndex({
    blacklists,
    metrics,
    filters,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(filters.category || 'all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>(filters.severity || 'all');
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'active');

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
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
            search: search.trim() || undefined,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            ...newOverrides,
        };

        Object.keys(query).forEach((key) => query[key] === undefined && delete query[key]);

        router.get(prefixedRoute('partners.blacklist.index'), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
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

    const deleteItem = (item: BlacklistItem) => {
        if (confirm(`Hapus permanen catatan daftar hitam untuk ${item.name}?`)) {
            router.delete(prefixedRoute('partners.blacklist.destroy', item.id), {
                preserveScroll: true,
            });
        }
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
                    label: '⛔ TOLAK MUTLAK (BAHAYA TINGGI)',
                    cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                };
            case 'warning':
                return {
                    label: '⚠️ WASPADA (JAMINAN EKSTRA)',
                    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                };
            case 'caution':
                return {
                    label: '📝 CATATAN KHUSUS',
                    cls: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                };
        }
    };

    const getCategoryLabel = (category: BlacklistItem['category']) => {
        switch (category) {
            case 'car_theft':
                return 'Penggelapan Armada';
            case 'pawn_attempt':
                return 'Percobaan Gadai Tanpa Izin';
            case 'bad_debt':
                return 'Gagal Bayar / Kabur';
            case 'fake_identity':
                return 'Pemalsuan Dokumen Identitas';
            case 'reckless_damage':
                return 'Kecelakaan / Rusak Berat Menolak Ganti';
            default:
                return 'Pelanggaran Lainnya';
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Daftar Hitam & Deteksi Anti-Fraud (Blacklist Registry)"
                    subtitle={
                        <span className="text-xs text-slate-500">
                            Database pencegahan penggelapan armada, pemalsuan identitas KTP/SIM, dan penunggakan sewa bermasalah.
                        </span>
                    }
                    actions={
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
                        >
                            <span>+ Tambah Daftar Hitam</span>
                        </button>
                    }
                />
            }
        >
            <Head title="Daftar Hitam Pelanggan & Anti-Fraud" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <PartnersNav />

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Total */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">📋</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Total Kasus
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                {metrics.total_cases}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                Riwayat Kasus Terdata
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Theft & Pawn Cases */}
                    <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-rose-50/50 p-5 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🚨</span>
                            <span className="rounded-full bg-rose-200/70 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                                Bahaya Fatal
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black tracking-tight text-rose-700 dark:text-rose-400">
                                {metrics.theft_cases}
                            </p>
                            <p className="mt-1 text-xs font-medium text-rose-600/90 dark:text-rose-400/80">
                                Modus Penggelapan & Gadai Gelap
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Bad Debt */}
                    <div className="overflow-hidden rounded-3xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">💸</span>
                            <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                Finansial
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black tracking-tight text-amber-700 dark:text-amber-400">
                                {metrics.bad_debt_cases}
                            </p>
                            <p className="mt-1 text-xs font-medium text-amber-600/90 dark:text-amber-400/80">
                                Kasus Gagal Bayar / Kabur
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Active Blacklists */}
                    <div className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-indigo-50/50 p-5 shadow-xs dark:border-indigo-900/60 dark:bg-indigo-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🔒</span>
                            <span className="rounded-full bg-indigo-200/70 px-2.5 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                                Cekal Aktif
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-black tracking-tight text-indigo-700 dark:text-indigo-400">
                                {metrics.active_cases}
                            </p>
                            <p className="mt-1 text-xs font-medium text-indigo-600/90 dark:text-indigo-400/80">
                                Identitas Terkunci dari Sewa
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                        <div className="sm:col-span-2">
                            <TextInput
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, NIK KTP, no HP, no LP, kronologi..."
                                className="w-full text-xs"
                            />
                        </div>

                        <div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    applyFilters({ category: e.target.value });
                                }}
                                className="w-full rounded-2xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="car_theft">Penggelapan Armada</option>
                                <option value="pawn_attempt">Percobaan Gadai</option>
                                <option value="bad_debt">Gagal Bayar / Kabur</option>
                                <option value="fake_identity">Identitas Palsu</option>
                                <option value="reckless_damage">Kecelakaan Menolak Ganti</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={selectedSeverity}
                                onChange={(e) => {
                                    setSelectedSeverity(e.target.value);
                                    applyFilters({ severity: e.target.value });
                                }}
                                className="w-full rounded-2xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="all">Semua Tingkat Bahaya</option>
                                <option value="critical">Tolak Mutlak (Critical)</option>
                                <option value="warning">Waspada (Warning)</option>
                                <option value="caution">Catatan (Caution)</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="w-full rounded-2xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="active">Status: Aktif Dicekal</option>
                                <option value="inactive">Status: Dicabut (Whitelist)</option>
                                <option value="all">Status: Semua Data</option>
                            </select>
                        </div>
                    </form>
                </div>

                {/* List / Table */}
                <div className="space-y-4">
                    {blacklists.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                            <span className="text-4xl">🛡️</span>
                            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                                Tidak Ada Data Daftar Hitam
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Tidak ditemukan catatan yang sesuai dengan filter pencarian.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {blacklists.map((item) => {
                                const sevBadge = getSeverityBadge(item.severity);
                                const phoneClean = item.phone.replace(/[^0-9]/g, '');

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-xs transition hover:shadow-md ${
                                            item.is_active
                                                ? 'border-rose-200/80 bg-white dark:border-rose-950/70 dark:bg-slate-900'
                                                : 'border-slate-200 bg-slate-50/50 opacity-70 dark:border-slate-800 dark:bg-slate-900/50'
                                        }`}
                                    >
                                        <div>
                                            {/* Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                                                <span
                                                    className={`inline-flex items-center rounded-xl border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${sevBadge.cls}`}
                                                >
                                                    {sevBadge.label}
                                                </span>

                                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {getCategoryLabel(item.category)}
                                                </span>
                                            </div>

                                            {/* Identity Details */}
                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                                                    <span className="text-[11px] font-bold text-slate-400">Identitas Pelaku</span>
                                                    <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                                                        {item.name}
                                                    </p>
                                                    <p className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                                                        NIK: {item.id_number}
                                                    </p>
                                                    {item.license_number && (
                                                        <p className="font-mono text-[11px] text-slate-500">
                                                            SIM: {item.license_number}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                                                    <span className="text-[11px] font-bold text-slate-400">Kontak & Laporan</span>
                                                    <p className="mt-1 font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                                                        HP: {item.phone}
                                                    </p>
                                                    {phoneClean && (
                                                        <a
                                                            href={`https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11px] font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                                                        >
                                                            💬 Verifikasi via WA
                                                        </a>
                                                    )}
                                                    {item.police_report_number && (
                                                        <p className="mt-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                            No. LP Polisi: {item.police_report_number}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Incident Details */}
                                            <div className="mt-3 rounded-2xl bg-rose-50/40 border border-rose-100/70 p-3.5 dark:border-rose-950/40 dark:bg-rose-950/10">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                                    <span>Kronologi & Modus Kejadian:</span>
                                                    {item.incident_date && (
                                                        <span>Tanggal: {formatDate(item.incident_date)}</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                                                    {item.incident_details}
                                                </p>
                                            </div>

                                            {/* Linked partner if exists */}
                                            {item.partner && (
                                                <div className="mt-2 text-[11px] text-slate-500">
                                                    Terhubung ke profil mitra: <Link href={prefixedRoute('partners.show', item.partner.id)} className="font-bold text-indigo-600 underline dark:text-indigo-400">{item.partner.name} ({item.partner.code})</Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                            <span className="text-[11px] text-slate-400">
                                                Dilaporkan: {formatDate(item.created_at)} {item.reporter ? `oleh ${item.reporter.name}` : ''}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStatus(item)}
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                                        item.is_active
                                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                                    }`}
                                                >
                                                    {item.is_active ? 'Cabut Blacklist (Whitelist)' : 'Aktifkan Cekal'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => deleteItem(item)}
                                                    className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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
                                className="mt-1 w-full text-xs"
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
                                className="mt-1 w-full text-xs font-mono"
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
                                className="mt-1 w-full text-xs font-mono"
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
                                className="mt-1 w-full text-xs font-mono"
                            />
                        </div>

                        <div>
                            <InputLabel value="Kategori Kasus *" />
                            <select
                                value={addForm.data.category}
                                onChange={(e) => addForm.setData('category', e.target.value as any)}
                                className="mt-1 w-full rounded-2xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                                className="mt-1 w-full rounded-2xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                                className="mt-1 w-full text-xs"
                            />
                        </div>

                        <div>
                            <InputLabel value="Nomor Laporan Polisi / LP (Opsional)" />
                            <TextInput
                                type="text"
                                value={addForm.data.police_report_number}
                                onChange={(e) => addForm.setData('police_report_number', e.target.value)}
                                placeholder="Contoh: LP/B/123/X/2026/SPKT"
                                className="mt-1 w-full text-xs"
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
                            className="mt-1 w-full rounded-2xl border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
        </DynamicLayout>
    );
}

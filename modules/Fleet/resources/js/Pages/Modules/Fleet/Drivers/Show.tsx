import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatDate } from '@/utils/date';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface DriverUser {
    id: number;
    name: string;
    username: string | null;
    email: string;
}

interface Driver {
    id: number;
    name: string;
    license_number: string;
    license_type: string | null;
    license_expires_at: string | null;
    phone: string;
    email: string | null;
    status: string;
    photo_url: string | null;
    notes: string | null;
    user: DriverUser | null;
}

interface DocumentSummary {
    total: number;
    expired: number;
    expiring_soon: number;
    nearest_expiry: string | null;
}

interface Props {
    driver: Driver;
    documentsEnabled?: boolean;
    documentSummary?: DocumentSummary | null;
    can: { update: boolean; delete: boolean };
}

type ExpiryTone = 'ok' | 'soon' | 'expired' | 'empty';

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'available':
            return { label: 'Tersedia / Standby', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', dot: 'bg-emerald-500' };
        case 'on_trip':
            return { label: 'Sedang Dalam Perjalanan', className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300', dot: 'bg-sky-500' };
        case 'off_duty':
            return { label: 'Istirahat / Off-Duty', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', dot: 'bg-amber-500' };
        case 'inactive':
            return { label: 'Non-Aktif', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' };
        default:
            return { label: status, className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' };
    }
};

function expiryTone(date: string | null): ExpiryTone {
    if (!date) return 'empty';
    const target = new Date(`${date}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 'empty';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'soon';
    return 'ok';
}

function expiryBadgeClass(tone: ExpiryTone): string {
    switch (tone) {
        case 'expired': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
        case 'soon': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
        case 'ok': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
        default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
}

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default function Show({
    driver,
    documentsEnabled = false,
    documentSummary = null,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const accountForm = useForm({
        name: driver.name,
        username: '',
        email: driver.email ?? '',
        password: '',
    });

    const confirmDelete = (): void => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.drivers.destroy', driver.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const submitAccount: FormEventHandler = (event) => {
        event.preventDefault();
        accountForm.post(prefixedRoute('fleet.drivers.account.store', driver.id), {
            preserveScroll: true,
            onSuccess: () => accountForm.reset('password'),
        });
    };

    const licenseTone = expiryTone(driver.license_expires_at);
    const statusInfo = getStatusBadge(driver.status);

    const licenseLabel = (): string => {
        if (licenseTone === 'expired') return '⚠️ SIM Telah Kadaluarsa';
        if (licenseTone === 'soon') return '⡒ Habis Dalam ≤30 Hari';
        if (licenseTone === 'ok') return '✓ Masih Berlaku';
        return '— Belum Diatur';
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={driver.name}
                    subtitle={`SIM ${driver.license_type || '—'} · No. ${driver.license_number}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={prefixedRoute('fleet.drivers.index')}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Kembali ke Daftar Pengemudi
                            </Link>

                            {documentsEnabled && (
                                <Link
                                    href={prefixedRoute('fleet.drivers.documents.index', driver.id)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    📄 Dokumen
                                </Link>
                            )}

                            {can.update && (
                                <Link
                                    href={prefixedRoute('fleet.drivers.edit', driver.id)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                                >
                                    ✏️ Edit Pengemudi
                                </Link>
                            )}

                            {can.delete && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                                >
                                    <TrashIcon />
                                    <span>Hapus</span>
                                </button>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={`${driver.name} · ${driver.license_number}`} />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-10">

                {/* Hero Identity Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        {/* Avatar / Photo */}
                        <div className="shrink-0">
                            {driver.photo_url ? (
                                <img
                                    src={driver.photo_url}
                                    alt={driver.name}
                                    className="h-28 w-28 rounded-2xl object-cover ring-2 ring-slate-200 shadow-md dark:ring-slate-700"
                                />
                            ) : (
                                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-indigo-50 to-slate-100 dark:border-slate-700 dark:from-indigo-950/40 dark:to-slate-850">
                                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                        {initials(driver.name) || '👤'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black ${statusInfo.className}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                                    {statusInfo.label}
                                </span>

                                {driver.license_type && (
                                    <span className="inline-flex items-center rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        🪪 SIM {driver.license_type}
                                    </span>
                                )}

                                <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${expiryBadgeClass(licenseTone)}`}>
                                    {licenseLabel()}
                                </span>

                                <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${driver.user ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    {driver.user ? '✓ Memiliki Login Portal' : '○ Belum Ada Login Portal'}
                                </span>
                            </div>

                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{driver.name}</h1>
                            <p className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">{driver.license_number}</p>

                            <div className="flex flex-wrap items-center gap-3">
                                {driver.phone && (
                                    <a
                                        href={`tel:${driver.phone}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    >
                                        📞 {driver.phone}
                                    </a>
                                )}
                                {driver.email && (
                                    <a
                                        href={`mailto:${driver.email}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300"
                                    >
                                        ✉️ {driver.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KPI Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 lg:grid-cols-4 dark:border-slate-800">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Operasional</p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                                <p className="text-sm font-black text-slate-900 dark:text-white">{statusInfo.label}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kelas / Golongan SIM</p>
                            <p className="mt-1 font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
                                {driver.license_type ? `SIM ${driver.license_type}` : '—'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Masa Berlaku SIM</p>
                            <span className={`mt-1 inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-black ${expiryBadgeClass(licenseTone)}`}>
                                {licenseLabel()}
                            </span>
                            <p className="mt-1 text-[11px] text-slate-500">
                                {driver.license_expires_at ? formatDate(driver.license_expires_at, localeTag) : 'Belum diatur'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akun Portal Pengemudi</p>
                            <p className={`mt-1 text-sm font-black ${driver.user ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {driver.user ? '✓ Aktif' : '○ Belum Ada'}
                            </p>
                            {driver.user && (
                                <p className="text-[10px] text-slate-400">{driver.user.username || driver.user.email}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left (Contact, Notes, Account) */}
                    <div className="space-y-6 lg:col-span-7">
                        {/* Contact Info Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">👤</span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Informasi Kontak & Data Pengemudi</h3>
                            </div>

                            <dl className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Nomor Telepon:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        {driver.phone ? (
                                            <a href={`tel:${driver.phone}`} className="font-mono text-indigo-600 hover:underline dark:text-indigo-400">
                                                {driver.phone}
                                            </a>
                                        ) : '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Alamat Email:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        {driver.email ? (
                                            <a href={`mailto:${driver.email}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                                                {driver.email}
                                            </a>
                                        ) : '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Nomor SIM:</dt>
                                    <dd className="font-mono font-black text-slate-800 dark:text-slate-200">{driver.license_number}</dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Golongan SIM:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        {driver.license_type ? `SIM ${driver.license_type}` : '—'}
                                    </dd>
                                </div>
                                {driver.notes && (
                                    <div className="py-2.5">
                                        <dt className="text-slate-400 mb-1">Catatan Pengemudi:</dt>
                                        <dd className="rounded-2xl border border-slate-100 bg-slate-50 p-3 leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                                            {driver.notes}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Account Provisioning Card */}
                        {can.update && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="text-base">🔑</span>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Akun Login Portal Pengemudi</h3>
                                        <p className="text-xs text-slate-400">Buat akun login untuk pengemudi agar dapat mengakses sistem portal armada.</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {driver.user ? (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                            <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">✓ Akun Login Telah Dibuat & Aktif</p>
                                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400/80">Username</p>
                                                    <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">{driver.user.username || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400/80">Email Login</p>
                                                    <p className="mt-1 font-bold text-slate-900 dark:text-white">{driver.user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="mb-4 text-xs text-slate-500">Pengemudi ini belum memiliki akun login. Isi formulir berikut untuk membuat akun portal baru.</p>
                                            <form onSubmit={submitAccount} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <InputLabel htmlFor="account_name" value="Nama Lengkap" />
                                                    <TextInput
                                                        id="account_name"
                                                        className="mt-1.5 block w-full !rounded-2xl"
                                                        value={accountForm.data.name}
                                                        onChange={(e) => accountForm.setData('name', e.target.value)}
                                                    />
                                                    <InputError message={accountForm.errors.name} className="mt-1" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="account_username" value="Username Login" />
                                                    <TextInput
                                                        id="account_username"
                                                        className="mt-1.5 block w-full !rounded-2xl font-mono"
                                                        value={accountForm.data.username}
                                                        onChange={(e) => accountForm.setData('username', e.target.value)}
                                                        autoComplete="off"
                                                    />
                                                    <InputError message={accountForm.errors.username} className="mt-1" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="account_email" value="Email" />
                                                    <TextInput
                                                        id="account_email"
                                                        type="email"
                                                        className="mt-1.5 block w-full !rounded-2xl"
                                                        value={accountForm.data.email}
                                                        onChange={(e) => accountForm.setData('email', e.target.value)}
                                                        autoComplete="off"
                                                    />
                                                    <InputError message={accountForm.errors.email} className="mt-1" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="account_password" value="Password Awal" />
                                                    <TextInput
                                                        id="account_password"
                                                        type="password"
                                                        className="mt-1.5 block w-full !rounded-2xl"
                                                        value={accountForm.data.password}
                                                        onChange={(e) => accountForm.setData('password', e.target.value)}
                                                        autoComplete="new-password"
                                                    />
                                                    <InputError message={accountForm.errors.password} className="mt-1" />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <PrimaryButton
                                                        disabled={accountForm.processing}
                                                        className="rounded-2xl"
                                                    >
                                                        {accountForm.processing ? 'Membuat Akun...' : '＋ Buat Akun Login Portal'}
                                                    </PrimaryButton>
                                                </div>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right (License & Documents) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* License Compliance Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">🪪</span>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Kepatuhan SIM & Sertifikasi</h3>
                                    <p className="text-xs text-slate-400">Kelola jadwal perpanjangan SIM pengemudi.</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">Masa Berlaku SIM</span>
                                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${expiryBadgeClass(licenseTone)}`}>
                                            {licenseLabel()}
                                        </span>
                                    </div>
                                    <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                        {driver.license_expires_at ? formatDate(driver.license_expires_at, localeTag) : 'Belum Diatur'}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
                                    <p className="text-xs font-bold text-slate-500">Nomor & Golongan SIM</p>
                                    <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">{driver.license_number}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {driver.license_type ? `Golongan SIM ${driver.license_type}` : 'Golongan tidak diisi'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Documents Card */}
                        {documentsEnabled && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">📄</span>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Dokumen Pengemudi</h3>
                                    </div>
                                    <Link
                                        href={prefixedRoute('fleet.drivers.documents.index', driver.id)}
                                        className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        Kelola Dokumen →
                                    </Link>
                                </div>

                                <div className="mt-4">
                                    {!documentSummary || documentSummary.total === 0 ? (
                                        <p className="py-4 text-center text-xs text-slate-400">Belum ada dokumen diunggah.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Total</p>
                                                <p className="mt-1 font-mono text-xl font-black text-slate-900 dark:text-white">{documentSummary.total}</p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Terdekat</p>
                                                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{formatDate(documentSummary.nearest_expiry, localeTag)}</p>
                                            </div>
                                            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
                                                <p className="text-[10px] text-rose-500 uppercase font-bold">Kadaluarsa</p>
                                                <p className="mt-1 font-mono text-xl font-black text-rose-600 dark:text-rose-400">{documentSummary.expired}</p>
                                            </div>
                                            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                                                <p className="text-[10px] text-amber-500 uppercase font-bold">Segera Habis</p>
                                                <p className="mt-1 font-mono text-xl font-black text-amber-600 dark:text-amber-400">{documentSummary.expiring_soon}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                message={`Apakah Anda yakin ingin menghapus pengemudi "${driver.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </DynamicLayout>
    );
}

import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { toDateInputValue } from '@/utils/date';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';

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
}

interface Props {
    driver: Driver;
}

const DRIVER_STATUSES = [
    { key: 'available', label: 'Tersedia / Standby', icon: '✅', desc: 'Pengemudi siap menerima penugasan perjalanan baru', color: 'emerald' },
    { key: 'on_trip', label: 'Sedang Dalam Perjalanan', icon: '🚗', desc: 'Sedang menjalankan trip atau penugasan aktif', color: 'sky' },
    { key: 'off_duty', label: 'Istirahat / Off-Duty', icon: '⏸', desc: 'Libur, cuti, atau tidak tersedia saat ini', color: 'amber' },
    { key: 'inactive', label: 'Non-Aktif / Berhenti', icon: '⛔', desc: 'Pengemudi tidak aktif, kontrak habis, atau berhenti', color: 'slate' },
] as const;

const LICENSE_TYPES = ['A', 'B1', 'B2', 'C', 'D'] as const;

export default function Edit({ driver }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: driver.name,
        license_number: driver.license_number,
        license_type: driver.license_type || '',
        license_expires_at: toDateInputValue(driver.license_expires_at),
        phone: driver.phone,
        email: driver.email || '',
        status: driver.status,
        photo_url: driver.photo_url || '',
        notes: driver.notes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('fleet.drivers.update', driver.id), {
            onError: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={`Edit Pengemudi: ${driver.name}`}
                    subtitle={`Perbarui data profil, nomor SIM, kontak, dan status operasional pengemudi.`}
                    actions={
                        <Link
                            href={prefixedRoute('fleet.drivers.show', driver.id)}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← Kembali ke Detail Pengemudi
                        </Link>
                    }
                />
            }
        >
            <Head title={`Edit Pengemudi · ${driver.name}`} />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">Fleet</Link>
                    <span>/</span>
                    <Link href={prefixedRoute('fleet.drivers.index')} className="hover:text-slate-700 dark:hover:text-slate-200">Pengemudi</Link>
                    <span>/</span>
                    <Link href={prefixedRoute('fleet.drivers.show', driver.id)} className="hover:text-slate-700 dark:hover:text-slate-200">{driver.name}</Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Edit</span>
                </nav>

                <form id="fleet-driver-edit-form" onSubmit={submit} className="space-y-6">
                    {/* Card 1: Profil & Foto */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">1</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Foto & Identitas Pengemudi</h3>
                                <p className="text-xs text-slate-500">Foto wajah, nama lengkap, dan status ketersediaan operasional.</p>
                            </div>
                        </div>

                        {/* Photo */}
                        <div>
                            <InputLabel value="Foto Pengemudi (Opsional)" />
                            <p className="text-xs text-slate-400 mb-2">Upload foto wajah pengemudi untuk kemudahan identifikasi di lapangan.</p>
                            <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} />
                            <InputError message={errors.photo_url} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Nama Lengkap Pengemudi *" />
                            <TextInput
                                id="name"
                                className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoFocus
                                placeholder="Budi Santoso, Agus Salim..."
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        {/* Status Selector */}
                        <div>
                            <InputLabel value="Status Ketersediaan Operasional *" />
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {DRIVER_STATUSES.map((status) => {
                                    const active = data.status === status.key;
                                    return (
                                        <button
                                            key={status.key}
                                            type="button"
                                            onClick={() => setData('status', status.key)}
                                            className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                                                active
                                                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/40'
                                            }`}
                                        >
                                            <span className="text-lg">{status.icon}</span>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{status.label}</p>
                                                <p className="mt-0.5 text-[10px] text-slate-500 leading-relaxed">{status.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.status} className="mt-1" />
                        </div>
                    </div>

                    {/* Card 2: Kontak */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">2</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Informasi Kontak</h3>
                                <p className="text-xs text-slate-500">Nomor telepon dan alamat email pengemudi untuk keperluan komunikasi.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="phone" value="Nomor Telepon / WhatsApp *" />
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    required
                                    placeholder="081234567890"
                                />
                                <InputError message={errors.phone} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Alamat Email (Opsional)" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="pengemudi@example.com"
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: SIM & Sertifikasi */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">3</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">SIM & Sertifikasi Mengemudi</h3>
                                <p className="text-xs text-slate-500">Nomor SIM, golongan kelas SIM, dan tanggal jatuh tempo perpanjangan.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="license_number" value="Nomor SIM *" />
                                <TextInput
                                    id="license_number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-black shadow-2xs"
                                    value={data.license_number}
                                    onChange={(e) => setData('license_number', e.target.value.toUpperCase())}
                                    required
                                    placeholder="1234567890"
                                />
                                <InputError message={errors.license_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="license_type" value="Golongan SIM (Kelas)" />
                                <TextInput
                                    id="license_type"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-bold shadow-2xs"
                                    value={data.license_type}
                                    onChange={(e) => setData('license_type', e.target.value.toUpperCase())}
                                    placeholder="B1, B2, A..."
                                />
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {LICENSE_TYPES.map((lt) => (
                                        <button
                                            key={lt}
                                            type="button"
                                            onClick={() => setData('license_type', lt)}
                                            className={`rounded-xl px-2 py-0.5 text-[10px] font-bold transition ${
                                                data.license_type === lt
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            SIM {lt}
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.license_type} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="license_expires_at" value="Masa Berlaku SIM (Kadaluarsa)" />
                                <TextInput
                                    id="license_expires_at"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.license_expires_at}
                                    onChange={(e) => setData('license_expires_at', e.target.value)}
                                />
                                <InputError message={errors.license_expires_at} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Catatan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">4</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Catatan Tambahan</h3>
                                <p className="text-xs text-slate-500">Catatan khusus kondisi pengemudi, riwayat kecelakaan, atau informasi penting lainnya.</p>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Catatan Khusus Pengemudi" />
                            <textarea
                                id="notes"
                                rows={3}
                                className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Catatan rute favorit, keahlian khusus, atau informasi penting tentang pengemudi..."
                            />
                            <InputError message={errors.notes} className="mt-1" />
                        </div>
                    </div>
                    {/* Form Action Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-black text-slate-900 dark:text-white">{data.name || driver.name}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500">{DRIVER_STATUSES.find((s) => s.key === data.status)?.label ?? data.status}</span>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={prefixedRoute('fleet.drivers.show', driver.id)}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Batal
                            </Link>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md"
                            >
                                {processing ? 'Menyimpan Perubahan...' : '💾 Simpan Perubahan Pengemudi'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

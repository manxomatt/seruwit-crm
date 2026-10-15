import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import PartnersNav from '../../../../PartnersNav';

interface PartnerRef {
    id: number;
    name: string;
    code: string;
    phone: string | null;
    id_number?: string | null;
}

interface Props {
    partner?: PartnerRef | null;
    partners?: PartnerRef[];
}

const SEVERITY_OPTIONS = [
    {
        key: 'critical',
        title: '⛔ Tolak Mutlak (Critical Danger)',
        desc: 'Penggelapan armada, gadai gelap, sindikat, atau pemalsuan KTP. Sistem otomatis menolak booking mutlak.',
        badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300',
        activeCardClass: 'border-rose-500 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/20 ring-2 ring-rose-500/20',
    },
    {
        key: 'warning',
        title: '⚠️ Waspada Tinggi (Warning)',
        desc: 'Penunggakan berulang, kabur saat pelunasan sewa, atau riwayat bermasalah yang memerlukan jaminan deposit berlipat.',
        badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300',
        activeCardClass: 'border-amber-500 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20 ring-2 ring-amber-500/20',
    },
    {
        key: 'caution',
        title: '📝 Catatan Khusus (Caution)',
        desc: 'Pelanggaran SOP operasional, kerusakan kendaraan yang menolak ganti rugi, atau sengketa denda.',
        badgeClass: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300',
        activeCardClass: 'border-slate-500 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40 ring-2 ring-slate-500/20',
    },
] as const;

const CATEGORIES = [
    { value: 'car_theft', label: '🚗 Penggelapan Armada Rental' },
    { value: 'pawn_attempt', label: '💸 Percobaan Gadai Tanpa Izin' },
    { value: 'bad_debt', label: '🚫 Gagal Bayar / Kabur Tanpa Pelunasan' },
    { value: 'fake_identity', label: '🪪 Pemalsuan Dokumen Identitas KTP/SIM' },
    { value: 'reckless_damage', label: '💥 Kecelakaan / Rusak Berat Menolak Ganti' },
    { value: 'other', label: '⚠️ Pelanggaran Operasional Lainnya' },
] as const;

export default function BlacklistCreate({ partner, partners = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const { data, setData, post, processing, errors } = useForm({
        name: partner?.name || '',
        id_number: partner?.id_number || '',
        phone: partner?.phone || '',
        license_number: '',
        category: 'car_theft' as (typeof CATEGORIES)[number]['value'],
        severity: 'critical' as (typeof SEVERITY_OPTIONS)[number]['key'],
        incident_date: new Date().toISOString().slice(0, 10),
        incident_details: '',
        police_report_number: '',
        partner_id: partner?.id || null,
        is_shared_with_community: false,
        share_anonymously: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('partners.blacklist.store'));
    };

    const textareaClass =
        'mt-1 block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs focus:border-rose-500 focus:ring-rose-500 text-xs leading-relaxed p-3.5';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {t('partners.nav.blacklist', undefined, 'Daftar Hitam & Anti-Fraud')}
                        </p>
                        <h2 className="text-xl font-black leading-tight text-slate-900 dark:text-white">
                            Tambah Catatan Daftar Hitam (Blacklist)
                        </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={prefixedRoute('partners.blacklist.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs shadow-xs">
                                {t('common.cancel', undefined, 'Batal')}
                            </SecondaryButton>
                        </Link>
                        <PrimaryButton
                            type="submit"
                            form="blacklist-create-form"
                            disabled={processing}
                            className="!rounded-xl text-xs shadow-xs bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan & Aktifkan Daftar Hitam'}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title="Tambah Catatan Daftar Hitam - Anti-Fraud" />

            <PartnersNav />

            {/* Warning Guide Banner */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20 p-5 shadow-xs">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xl">
                        🛡️
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                            Sistem Perlindungan Aset & Pencegahan Penggelapan Armada
                        </h4>
                        <p className="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300/80 leading-relaxed max-w-3xl">
                            Catatan yang dimasukkan ke sini akan langsung mengunci identitas <strong>Nomor KTP (NIK)</strong> dan <strong>Nomor Telepon/WhatsApp</strong> di seluruh aplikasi. Sistem akan mendeteksi dan menolak pemesanan rental mobil secara otomatis saat pelanggan mencoba bertransaksi.
                        </p>
                    </div>
                </div>
            </div>

            <form id="blacklist-create-form" onSubmit={submit} className="space-y-6">
                {/* Section 1: Identitas Lengkap Terduga / Pelaku */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                                👤
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Identitas Terduga / Pelaku
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Pilih dari kontak mitra terdaftar atau masukkan identitas baru sesuai KTP/Paspor.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5">
                        {/* Searchable Combobox for Registered Partners */}
                        <div>
                            <InputLabel value="Tautkan ke Profil Kontak / Mitra Terdaftar (Opsional)" />
                            <p className="mb-1.5 text-[11px] text-slate-500">
                                Jika pelaku sudah pernah terdaftar sebagai customer/kontak, pilih dari daftar untuk auto-fill identitas.
                            </p>
                            <Select
                                className="w-full !rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                                value={data.partner_id ? String(data.partner_id) : ''}
                                onChange={(val) => {
                                    const pId = val ? Number(val) : null;
                                    setData('partner_id', pId);
                                    if (pId && partners.length > 0) {
                                        const matched = partners.find((p) => p.id === pId);
                                        if (matched) {
                                            if (!data.name) setData('name', matched.name);
                                            if (!data.phone && matched.phone) setData('phone', matched.phone);
                                            if (!data.id_number && matched.id_number) setData('id_number', matched.id_number);
                                        }
                                    }
                                }}
                                placeholder="Cari atau pilih kontak mitra yang terdaftar..."
                                searchable
                                options={[
                                    { value: '', label: '— Tidak ditautkan ke mitra manapun (Kasus Baru) —' },
                                    ...partners.map((p) => ({
                                        value: String(p.id),
                                        label: `${p.name} (${p.code})`,
                                        description: [p.phone, p.id_number ? `NIK: ${p.id_number}` : null].filter(Boolean).join(' • '),
                                    })),
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                            <div>
                                <InputLabel value="Nama Lengkap Sesuai KTP *" />
                                <TextInput
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="mt-1 w-full text-xs !rounded-xl"
                                    required
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Nomor NIK KTP / Paspor *" />
                                <TextInput
                                    type="text"
                                    value={data.id_number}
                                    onChange={(e) => setData('id_number', e.target.value)}
                                    placeholder="16 digit NIK KTP (misal: 3578210000000001)"
                                    className="mt-1 w-full text-xs font-mono !rounded-xl"
                                    required
                                />
                                <InputError message={errors.id_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Nomor Telepon / WhatsApp *" />
                                <TextInput
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="Nomor aktif (misal: 081234567890)"
                                    className="mt-1 w-full text-xs font-mono !rounded-xl"
                                    required
                                />
                                <InputError message={errors.phone} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Nomor SIM (Surat Izin Mengemudi) - Opsional" />
                                <TextInput
                                    type="text"
                                    value={data.license_number}
                                    onChange={(e) => setData('license_number', e.target.value)}
                                    placeholder="Nomor SIM A / SIM B1"
                                    className="mt-1 w-full text-xs font-mono !rounded-xl"
                                />
                                <InputError message={errors.license_number} className="mt-1" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Klasifikasi Bahaya & Kategori Kasus */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                                ⚖️
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Tingkat Bahaya & Kategori Kasus
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tentukan tingkat kewaspadaan dan jenis pelanggaran yang dilakukan pelaku.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-6">
                        {/* Severity Selector Cards */}
                        <div>
                            <InputLabel value="Tingkat Risiko & Bahaya (Severity) *" />
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {SEVERITY_OPTIONS.map((opt) => {
                                    const isSelected = data.severity === opt.key;
                                    return (
                                        <div
                                            key={opt.key}
                                            onClick={() => setData('severity', opt.key as any)}
                                            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                                                isSelected
                                                    ? opt.activeCardClass
                                                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                                    {opt.title}
                                                </h4>
                                                <input
                                                    type="radio"
                                                    name="severity"
                                                    checked={isSelected}
                                                    onChange={() => setData('severity', opt.key as any)}
                                                    className="h-4 w-4 border-slate-300 text-rose-600 focus:ring-rose-500"
                                                />
                                            </div>
                                            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {opt.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            <InputError message={errors.severity} className="mt-1" />
                        </div>

                        {/* Category Select Combobox */}
                        <div>
                            <InputLabel value="Kategori Kasus Pelanggaran *" />
                            <div className="mt-1">
                                <Select
                                    className="w-full !rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                                    value={data.category}
                                    onChange={(val) => setData('category', val as any)}
                                    placeholder="Pilih kategori kasus..."
                                    options={CATEGORIES.map((cat) => ({
                                        value: cat.value,
                                        label: cat.label,
                                    }))}
                                />
                            </div>
                            <InputError message={errors.category} className="mt-1" />
                        </div>
                    </div>
                </section>

                {/* Section 3: Kronologi & Bukti Hukum */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-sm">
                                📝
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Kronologi Kejadian & Bukti Hukum
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tuliskan kronologi secara detail, nomor plat armada terkait, dan nomor laporan kepolisian jika ada.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Tanggal Kejadian Kasus" />
                                <TextInput
                                    type="date"
                                    value={data.incident_date}
                                    onChange={(e) => setData('incident_date', e.target.value)}
                                    className="mt-1 w-full text-xs !rounded-xl"
                                />
                                <InputError message={errors.incident_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Nomor Laporan Polisi (LP) / Surat Gugatan - Opsional" />
                                <TextInput
                                    type="text"
                                    value={data.police_report_number}
                                    onChange={(e) => setData('police_report_number', e.target.value)}
                                    placeholder="Contoh: LP/B/123/X/2026/SPKT/POLRESTABES"
                                    className="mt-1 w-full text-xs font-mono !rounded-xl"
                                />
                                <InputError message={errors.police_report_number} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Kronologi & Modus Kejadian Lengkap *" />
                            <textarea
                                rows={5}
                                value={data.incident_details}
                                onChange={(e) => setData('incident_details', e.target.value)}
                                placeholder="Jelaskan dengan terperinci:&#10;1. Modus sewa yang digunakan (unit kendaraan, nomor plat mobil yang disewa).&#10;2. Kronologi saat unit tidak dikembalikan atau percobaan penggelapan.&#10;3. Rekan / komplotan yang mendampingi pelaku.&#10;4. Upaya mediasi atau langkah hukum yang telah ditempuh."
                                className={textareaClass}
                                required
                            />
                            <InputError message={errors.incident_details} className="mt-1" />
                        </div>
                    </div>
                </section>

                {/* Section 4: Jaringan Anti-Penggelapan Komunitas Seruwit */}
                <section className="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="border-b border-indigo-100/70 dark:border-indigo-950/50 bg-gradient-to-r from-indigo-50/70 via-indigo-50/30 to-transparent dark:from-indigo-950/30 dark:via-transparent p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm">
                                    🌐
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Jaringan Anti-Penggelapan Komunitas Seruwit (Lintas Tenant)
                                        </h3>
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-950 dark:text-indigo-300">
                                            Opsional & Rahasia
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Bantu sesama pengusaha rental mencegah sindikat penggelapan armada dan penipuan identitas di seluruh Indonesia.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4">
                        <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                            <input
                                type="checkbox"
                                checked={data.is_shared_with_community}
                                onChange={(e) => setData('is_shared_with_community', e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <div className="text-xs">
                                <span className="font-bold text-slate-900 dark:text-white block">
                                    Bagikan Kasus Ini ke Jaringan Komunitas Rental Seruwit
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                                    Ketika dicentang, data NIK, No. HP, dan kategori kasus akan masuk ke database intelijen bersama. Rental lain dalam jaringan akan otomatis mendapatkan peringatan dini saat orang ini mencoba menyewa kendaraan.
                                </span>
                            </div>
                        </label>

                        {data.is_shared_with_community && (
                            <div className="pl-7 pt-1 space-y-3">
                                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.share_anonymously}
                                        onChange={(e) => setData('share_anonymously', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                    <span>
                                        <strong>Samarkan nama rental saya</strong> (Tampilkan sebagai <em>"Mitra Rental Terverifikasi"</em> untuk menjaga kerahasiaan bisnis)
                                    </span>
                                </label>

                                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                    <span className="shrink-0 text-sm">💡</span>
                                    <span>
                                        <strong>Komitmen Bersama:</strong> Pastikan data yang dibagikan adalah akurat dan dapat dipertanggungjawabkan (disertai kronologi/bukti hukum) demi menjaga integritas ekosistem transportasi rental Indonesia.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <Link href={prefixedRoute('partners.blacklist.index')}>
                        <SecondaryButton type="button" className="!rounded-xl text-xs shadow-xs px-5 py-2.5">
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                    </Link>
                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        className="!rounded-xl text-xs shadow-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 px-6 py-2.5"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan & Aktifkan Daftar Hitam'}
                    </PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}

import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

export interface WhatsappSettings {
    is_enabled: boolean;
    provider: string;
    fonnte_token: string;
    custom_url: string;
    custom_token: string;
    send_on_booking_confirmed: boolean;
    send_on_checkout: boolean;
    send_on_return: boolean;
    send_on_driver_assigned?: boolean;
    send_to_driver_on_duty?: boolean;
}

export interface DeviceStatus {
    connected: boolean;
    status: string;
    message?: string;
}

interface Props {
    settings: WhatsappSettings;
    deviceStatus?: DeviceStatus;
}

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <header className="mb-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </header>
            <div className="space-y-5">{children}</div>
        </section>
    );
}

export default function WhatsappPanel({ settings, deviceStatus }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const form = useForm({
        is_enabled: settings.is_enabled,
        provider: settings.provider || 'fonnte',
        fonnte_token: settings.fonnte_token || '',
        custom_url: settings.custom_url || '',
        custom_token: settings.custom_token || '',
        send_on_booking_confirmed: settings.send_on_booking_confirmed ?? true,
        send_on_checkout: settings.send_on_checkout ?? true,
        send_on_return: settings.send_on_return ?? true,
        send_on_driver_assigned: settings.send_on_driver_assigned ?? true,
        send_to_driver_on_duty: settings.send_to_driver_on_duty ?? true,
    });

    const testForm = useForm({
        target_phone: '',
    });

    const [testSent, setTestSent] = useState(false);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.patch(prefixedRoute('rental.settings.whatsapp.update'), {
            preserveScroll: true,
        });
    };

    const handleSendTest: FormEventHandler = (e) => {
        e.preventDefault();
        testForm.post(prefixedRoute('rental.settings.whatsapp.test'), {
            preserveScroll: true,
            onSuccess: () => {
                setTestSent(true);
                setTimeout(() => setTestSent(false), 5000);
            },
        });
    };

    const isConnected = deviceStatus?.connected ?? false;

    return (
        <div className="space-y-8">
            {/* Status Koneksi Banner */}
            <div
                className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
                    isConnected
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200'
                }`}
            >
                <div className="flex items-center gap-3">
                    <span className="flex h-3.5 w-3.5 relative">
                        <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                        />
                        <span
                            className={`relative inline-flex h-3.5 w-3.5 rounded-full ${
                                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                        />
                    </span>
                    <div>
                        <h4 className="text-sm font-semibold">
                            Status WhatsApp Gateway: {isConnected ? 'Terhubung (Ready)' : 'Belum Terhubung'}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {deviceStatus?.message || 'Konfigurasikan token API untuk mengaktifkan pengiriman pesan otomatis.'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Pengaturan Utama */}
                <Section
                    title="Aktivasi & Provider Gateway"
                    subtitle="Pilih layanan gateway pengiriman pesan WhatsApp untuk nomor bisnis rental Anda."
                >
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="is_enabled"
                            checked={form.data.is_enabled}
                            onChange={(e) => form.setData('is_enabled', e.target.checked)}
                        />
                        <InputLabel
                            htmlFor="is_enabled"
                            value="Aktifkan Notifikasi Otomatis WhatsApp"
                            className="cursor-pointer font-medium"
                        />
                    </div>

                    <div className="max-w-md">
                        <InputLabel htmlFor="provider" value="Penyedia Gateway (Provider)" />
                        <Select
                            id="provider"
                            value={form.data.provider}
                            onChange={(value) => form.setData('provider', value)}
                            options={[
                                { value: 'fonnte', label: 'Fonnte (Rekomendasi - Mudah & Scan QR)' },
                                { value: 'custom', label: 'Custom Gateway Sendiri (Self-Hosted / Webhook)' },
                                { value: 'log', label: 'Mode Simulasi (Log Only - Tanpa Kuota)' },
                            ]}
                            searchable={false}
                            className="mt-1 w-full"
                        />
                        <p className="mt-1.5 text-xs text-slate-500">
                            Setiap tenant menggunakan kredensial WhatsApp masing-masing agar pesan dikirim atas nama nomor CS kantor sendiri.
                        </p>
                    </div>

                    {form.data.provider === 'fonnte' && (
                        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <div>
                                <InputLabel htmlFor="fonnte_token" value="Token API Fonnte" />
                                <TextInput
                                    id="fonnte_token"
                                    type="password"
                                    value={form.data.fonnte_token}
                                    onChange={(e) => form.setData('fonnte_token', e.target.value)}
                                    placeholder="Masukkan token dari dashboard Fonnte..."
                                    className="mt-1 w-full font-mono text-sm"
                                />
                                <InputError message={form.errors.fonnte_token} className="mt-1" />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Dapatkan token perangkat dengan mendaftarkan nomor CS Anda di{' '}
                                    <a
                                        href="https://fonnte.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 underline hover:text-emerald-700"
                                    >
                                        fonnte.com
                                    </a>
                                    .
                                </p>
                            </div>
                        </div>
                    )}

                    {form.data.provider === 'custom' && (
                        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <div>
                                <InputLabel htmlFor="custom_url" value="Endpoint URL WhatsApp Gateway Anda" />
                                <TextInput
                                    id="custom_url"
                                    type="url"
                                    value={form.data.custom_url}
                                    onChange={(e) => form.setData('custom_url', e.target.value)}
                                    placeholder="https://wa.domainanda.com/api/send"
                                    className="mt-1 w-full font-mono text-sm"
                                />
                                <InputError message={form.errors.custom_url} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="custom_token" value="Bearer Token / Secret API Key (Opsional)" />
                                <TextInput
                                    id="custom_token"
                                    type="password"
                                    value={form.data.custom_token}
                                    onChange={(e) => form.setData('custom_token', e.target.value)}
                                    placeholder="Secret token untuk otentikasi..."
                                    className="mt-1 w-full font-mono text-sm"
                                />
                                <InputError message={form.errors.custom_token} className="mt-1" />
                            </div>
                        </div>
                    )}
                </Section>

                {/* 2. Pemicu Pengiriman Otomatis */}
                <Section
                    title="Pemicu Pengiriman Pesan (Automation Triggers)"
                    subtitle="Pilih kejadian apa saja yang akan memicu pengiriman pesan WhatsApp otomatis ke pelanggan."
                >
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                                checked={form.data.send_on_booking_confirmed}
                                onChange={(e) => form.setData('send_on_booking_confirmed', e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    Konfirmasi Booking & Bukti Pembayaran Lunas
                                </span>
                                <p className="text-xs text-slate-500">
                                    Mengirimkan rincian armada, jadwal sewa, status lunas QRIS/VA, dan link voucher sewa saat booking dikonfirmasi.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                                checked={form.data.send_on_checkout}
                                onChange={(e) => form.setData('send_on_checkout', e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    Berita Acara Serah Terima (Handover Checkout)
                                </span>
                                <p className="text-xs text-slate-500">
                                    Mengirimkan catatan odometer awal, level bensin, dan link Surat Perjanjian Sewa PDF ke penyewa saat serah kunci.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                                checked={form.data.send_on_return}
                                onChange={(e) => form.setData('send_on_return', e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    Bukti Pengembalian & Status Pengembalian Deposit
                                </span>
                                <p className="text-xs text-slate-500">
                                    Mengirimkan total kilometer yang ditempuh, konfirmasi unit diterima kembali, dan informasi refund uang jaminan deposit.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                                checked={form.data.send_on_driver_assigned}
                                onChange={(e) => form.setData('send_on_driver_assigned', e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    Informasi Penugasan Pengemudi ke Pelanggan
                                </span>
                                <p className="text-xs text-slate-500">
                                    Mengirimkan nama pengemudi, nomor kontak WhatsApp sopir, dan konfirmasi unit ke penyewa saat sopir ditugaskan.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                                checked={form.data.send_to_driver_on_duty}
                                onChange={(e) => form.setData('send_to_driver_on_duty', e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    Kirim Surat Tugas (SPPD) ke WhatsApp Driver
                                </span>
                                <p className="text-xs text-slate-500">
                                    Mengirimkan rincian surat tugas (nama tamu, no telp, titik jemput, tujuan, jam keberangkatan & uang jalan) langsung ke pengemudi.
                                </p>
                            </div>
                        </label>
                    </div>
                </Section>

                {/* Tombol Simpan */}
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">
                        {form.isDirty ? '⚠️ Ada perubahan belum disimpan' : 'Semua perubahan tersimpan'}
                    </p>
                    <PrimaryButton disabled={form.processing}>
                        {form.processing ? 'Menyimpan…' : 'Simpan Pengaturan WhatsApp'}
                    </PrimaryButton>
                </div>
            </form>

            {/* 3. Panel Pengujian Pengiriman Pesan */}
            <Section
                title="Uji Coba Pengiriman Pesan"
                subtitle="Kirimkan pesan uji coba ke nomor WhatsApp Anda untuk memastikan gateway bekerja dengan sempurna."
            >
                <form onSubmit={handleSendTest} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <InputLabel htmlFor="target_phone" value="Nomor WhatsApp Penerima" />
                        <TextInput
                            id="target_phone"
                            type="text"
                            value={testForm.data.target_phone}
                            onChange={(e) => testForm.setData('target_phone', e.target.value)}
                            placeholder="081234567890"
                            className="mt-1 w-full"
                            required
                        />
                        <InputError message={testForm.errors.target_phone} className="mt-1" />
                    </div>
                    <SecondaryButton
                        type="submit"
                        disabled={testForm.processing || !testForm.data.target_phone}
                        className="h-10 shrink-0"
                    >
                        {testForm.processing ? 'Mengirim…' : '📱 Kirim Pesan Tes'}
                    </SecondaryButton>
                </form>
                {testSent && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        ✓ Permintaan pengiriman pesan uji coba berhasil diproses. Silakan periksa aplikasi WhatsApp Anda.
                    </p>
                )}
            </Section>
        </div>
    );
}

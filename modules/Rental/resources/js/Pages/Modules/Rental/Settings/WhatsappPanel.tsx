import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, ReactNode, useEffect, useState } from 'react';

export interface WhatsappSettings {
    is_enabled: boolean;
    provider?: string;
    fonnte_token?: string;
    custom_url?: string;
    custom_token?: string;
    send_on_booking_confirmed: boolean;
    send_on_checkout: boolean;
    send_on_return: boolean;
    send_on_driver_assigned?: boolean;
    send_to_driver_on_duty?: boolean;
    require_otp_on_self_service?: boolean;
}

export interface DeviceStatus {
    connected: boolean;
    status: string;
    phone?: string;
    push_name?: string;
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
        provider: settings.provider || 'seruwit',
        fonnte_token: settings.fonnte_token || '',
        custom_url: settings.custom_url || '',
        custom_token: settings.custom_token || '',
        send_on_booking_confirmed: settings.send_on_booking_confirmed ?? true,
        send_on_checkout: settings.send_on_checkout ?? true,
        send_on_return: settings.send_on_return ?? true,
        send_on_driver_assigned: settings.send_on_driver_assigned ?? true,
        send_to_driver_on_duty: settings.send_to_driver_on_duty ?? true,
        require_otp_on_self_service: settings.require_otp_on_self_service ?? true,
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

    const [status, setStatus] = useState<DeviceStatus>(deviceStatus || { connected: false, status: 'DISCONNECTED' });
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const checkLiveStatus = async () => {
        setIsCheckingStatus(true);
        try {
            const res = await axios.get(prefixedRoute('settings.whatsapp.status'));
            if (res.data && res.data.success) {
                const isConn = res.data.status === 'CONNECTED';
                setStatus({
                    connected: isConn,
                    status: res.data.status,
                    phone: res.data.phone,
                    push_name: res.data.push_name,
                    message: isConn
                        ? `Terhubung ke nomor ${res.data.phone}`
                        : 'WhatsApp belum terhubung. Hubungkan nomor bisnis Anda di Pengaturan Tenant.',
                });
            }
        } catch (e) {
            // Ignore background polling errors
        } finally {
            setIsCheckingStatus(false);
        }
    };

    useEffect(() => {
        if (deviceStatus) {
            setStatus(deviceStatus);
        }
        checkLiveStatus();
    }, [deviceStatus]);

    const isConnected = Boolean(status?.connected || status?.status === 'CONNECTED');

    return (
        <div className="space-y-8">
            {/* Status Koneksi WhatsApp Bisnis Banner */}
            <div
                className={`flex flex-col gap-4 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm ${
                    isConnected
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-100'
                        : 'border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100'
                }`}
            >
                <div className="flex items-center gap-3.5">
                    <span className="relative flex h-4 w-4">
                        <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                        />
                        <span
                            className={`relative inline-flex h-4 w-4 rounded-full ${
                                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                        />
                    </span>
                    <div>
                        <h4 className="text-base font-bold flex items-center gap-2">
                            <span>Nomor WhatsApp Bisnis:</span>
                            {isConnected ? (
                                <span className="text-emerald-700 dark:text-emerald-300">
                                    🟢 Terhubung {status?.phone ? `(+${status.phone})` : ''}
                                </span>
                            ) : (
                                <span className="text-amber-700 dark:text-amber-300">
                                    ⚪ Belum Terhubung
                                </span>
                            )}
                            {isCheckingStatus && (
                                <span className="text-[11px] font-normal text-slate-400 animate-pulse">
                                    (memeriksa...)
                                </span>
                            )}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {isConnected
                                ? `Koneksi gateway aktif. Semua notifikasi modul rental akan dikirim menggunakan nomor ini.`
                                : `Nomor WhatsApp belum terhubung ke sistem. Hubungkan nomor bisnis Anda di Pengaturan Tenant.`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={checkLiveStatus}
                        disabled={isCheckingStatus}
                        title="Perbarui Status Koneksi"
                        className="inline-flex items-center justify-center rounded-xl p-2.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                    >
                        <span className={isCheckingStatus ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
                    </button>
                    <Link
                        href={prefixedRoute('settings.whatsapp')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all ${
                            isConnected
                                ? 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white'
                                : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                    >
                        <span>💬</span>
                        <span>{isConnected ? 'Kelola Nomor di Pengaturan' : 'Hubungkan Nomor Sekarang ➔'}</span>
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Aktivasi Notifikasi Rental */}
                <Section
                    title="Aktivasi Notifikasi Rental"
                    subtitle="Aktifkan atau nonaktifkan pengiriman pesan WhatsApp otomatis khusus untuk operasional sewa kendaraan."
                >
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="is_enabled"
                            checked={form.data.is_enabled}
                            onChange={(e) => form.setData('is_enabled', e.target.checked)}
                        />
                        <InputLabel
                            htmlFor="is_enabled"
                            value="Aktifkan Notifikasi Otomatis WhatsApp untuk Modul Rental"
                            className="cursor-pointer font-bold text-sm"
                        />
                    </div>
                </Section>

                {/* 2. Pemicu Pengiriman Otomatis Modul Rental */}
                <Section
                    title="Pemicu Pengiriman Pesan (Automation Triggers)"
                    subtitle="Pilih kejadian apa saja di rental yang akan memicu pengiriman pesan WhatsApp otomatis ke pelanggan atau driver."
                >
                    <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                                checked={form.data.send_on_booking_confirmed}
                                onChange={(e) => form.setData('send_on_booking_confirmed', e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                    Konfirmasi Booking & Bukti Pembayaran Lunas
                                </span>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Mengirimkan rincian armada, jadwal sewa, status lunas pembayaran, dan link voucher sewa saat booking dikonfirmasi.
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
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                    Berita Acara Serah Terima (Handover Checkout)
                                </span>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Mengirimkan catatan odometer awal, level bensin, dan link Surat Perjanjian Sewa PDF ke penyewa saat serah kunci armada.
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
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                    Bukti Pengembalian & Status Pengembalian Deposit
                                </span>
                                <p className="text-xs text-slate-500 mt-0.5">
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
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                    Informasi Penugasan Pengemudi ke Pelanggan
                                </span>
                                <p className="text-xs text-slate-500 mt-0.5">
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
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                    Kirim Surat Perintah Jalan (SPPD) ke WhatsApp Driver
                                </span>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Mengirimkan rincian surat tugas (nama tamu, no telepon, titik jemput, jam keberangkatan & uang jalan) langsung ke WhatsApp pengemudi.
                                </p>
                            </div>
                        </label>
                    </div>
                </Section>

                {/* 3. Keamanan & Verifikasi Pemesanan Mandiri (Self-Service) */}
                <Section
                    title="Verifikasi Pemesanan Mandiri (Customer Self-Service)"
                    subtitle="Atur metode autentikasi & validasi identitas pemesan pada halaman pemesanan mandiri."
                >
                    <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                                checked={form.data.require_otp_on_self_service}
                                onChange={(e) => form.setData('require_otp_on_self_service', e.target.checked)}
                                className="mt-1"
                            />
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                                    Wajibkan Verifikasi Kode OTP WhatsApp pada Pemesanan Mandiri
                                </span>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Jika <strong>aktif</strong>: Pelanggan yang memesan unit melalui halaman website publik wajib memverifikasi nomor WhatsApp menggunakan kode OTP 6-digit sebelum menyelesaikan reservasi.
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                                    ⚠️ Jika <strong>dinonaktifkan</strong>: Kotak input dan pengiriman OTP WhatsApp ditiadakan. Sebagai gantinya, pelanggan <strong>wajib mengisi Alamat Email aktif</strong> pada formulir pemesanan / registrasi.
                                </p>
                            </div>
                        </label>
                    </div>
                </Section>

                {/* Tombol Simpan */}
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">
                        {form.isDirty ? '⚠️ Ada perubahan belum disimpan' : 'Semua pemicu tersimpan'}
                    </p>
                    <PrimaryButton disabled={form.processing} className="!rounded-xl shadow-sm">
                        {form.processing ? 'Menyimpan…' : 'Simpan Pengaturan WhatsApp Rental'}
                    </PrimaryButton>
                </div>
            </form>

            {/* 3. Panel Pengujian Pengiriman Pesan Rental */}
            <Section
                title="Uji Coba Pengiriman Notifikasi Rental"
                subtitle="Kirimkan pesan uji coba ke nomor WhatsApp Anda untuk memvalidasi pesan notifikasi rental."
            >
                <form onSubmit={handleSendTest} className="flex flex-col gap-3 sm:flex-row sm:items-end max-w-xl">
                    <div className="flex-1">
                        <InputLabel htmlFor="target_phone" value="Nomor WhatsApp Penerima" />
                        <TextInput
                            id="target_phone"
                            type="text"
                            value={testForm.data.target_phone}
                            onChange={(e) => testForm.setData('target_phone', e.target.value)}
                            placeholder="081234567890"
                            className="mt-1 w-full !rounded-xl !py-2 text-xs"
                            required
                        />
                        <InputError message={testForm.errors.target_phone} className="mt-1" />
                    </div>
                    <SecondaryButton
                        type="submit"
                        disabled={testForm.processing || !testForm.data.target_phone || !isConnected}
                        className="h-9 shrink-0 !rounded-xl text-xs"
                    >
                        {testForm.processing ? 'Mengirim…' : '📱 Kirim Pesan Tes Rental'}
                    </SecondaryButton>
                </form>
                {testSent && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        ✓ Permintaan pengiriman pesan uji coba berhasil diproses. Silakan periksa aplikasi WhatsApp Anda.
                    </p>
                )}
                {!isConnected && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        * Hubungkan nomor WhatsApp bisnis Anda terlebih dahulu di Pengaturan Tenant agar tombol tes aktif.
                    </p>
                )}
            </Section>
        </div>
    );
}

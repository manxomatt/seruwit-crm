import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';

interface DeviceStatus {
    connected: boolean;
    status: string;
    phone?: string;
    push_name?: string;
    qr_base64?: string;
    message?: string;
}

interface Props {
    deviceStatus: DeviceStatus;
    sessionId: string;
    isEnabled: boolean;
}

export default function WhatsAppSettings({ deviceStatus: initialStatus, sessionId }: Props) {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const page = usePage();
    const flash = (page.props as any).flash;

    const [status, setStatus] = useState<DeviceStatus>(initialStatus);
    const [pairingMode, setPairingMode] = useState<'qr' | 'code'>('qr');
    const [loadingQR, setLoadingQR] = useState(false);
    const [qrCode, setQrCode] = useState<string>(initialStatus.qr_base64 || '');
    const [phoneForCode, setPhoneForCode] = useState('');
    const [pairingCode, setPairingCode] = useState('');
    const [loadingCode, setLoadingCode] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [logoutProcessing, setLogoutProcessing] = useState(false);

    // Live status polling when scanning QR or waiting for pairing
    useEffect(() => {
        let timer: any = null;
        if (!status.connected && (qrCode || pairingCode)) {
            timer = setInterval(async () => {
                try {
                    const res = await axios.get(prefixedRoute('settings.whatsapp.status'));
                    if (res.data && res.data.success) {
                        if (res.data.status === 'CONNECTED') {
                            setStatus({
                                connected: true,
                                status: 'CONNECTED',
                                phone: res.data.phone,
                                push_name: res.data.push_name,
                                message: `Terhubung ke nomor ${res.data.phone}`,
                            });
                            setQrCode('');
                            setPairingCode('');
                            clearInterval(timer);
                            router.reload();
                        } else if (res.data.qr_base64 && res.data.qr_base64 !== qrCode) {
                            setQrCode(res.data.qr_base64);
                        }
                    }
                } catch (e) {
                    // Ignore polling errors
                }
            }, 3000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [status.connected, qrCode, pairingCode]);

    const handleStartQR = async () => {
        setLoadingQR(true);
        try {
            const res = await axios.post(prefixedRoute('settings.whatsapp.start'));
            if (res.data && res.data.success) {
                if (res.data.status === 'CONNECTED') {
                    setStatus({
                        connected: true,
                        status: 'CONNECTED',
                        phone: res.data.phone,
                        push_name: res.data.push_name,
                    });
                } else {
                    setQrCode(res.data.qr_base64 || '');
                }
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Gagal memulai sesi WhatsApp QR.');
        } finally {
            setLoadingQR(false);
        }
    };

    const handleRequestPairCode: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!phoneForCode) return;

        setLoadingCode(true);
        setPairingCode('');
        try {
            const res = await axios.post(prefixedRoute('settings.whatsapp.pair'), {
                phone: phoneForCode,
            });
            if (res.data && res.data.success) {
                setPairingCode(res.data.pairing_code);
            } else {
                alert(res.data?.error || 'Gagal membuat kode pairing.');
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Gagal membuat kode pairing.');
        } finally {
            setLoadingCode(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Apakah Anda yakin ingin memutuskan nomor WhatsApp bisnis ini dari sistem?')) {
            return;
        }

        setLogoutProcessing(true);
        try {
            await axios.post(prefixedRoute('settings.whatsapp.logout'));
            setStatus({
                connected: false,
                status: 'DISCONNECTED',
                message: 'WhatsApp berhasil diputuskan.',
            });
            setQrCode('');
            setPairingCode('');
            router.reload();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Gagal memutuskan sesi WhatsApp.');
        } finally {
            setLogoutProcessing(false);
        }
    };

    const handleSendTest: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!testPhone) return;

        setSendingTest(true);
        setTestFeedback(null);
        try {
            const res = await axios.post(prefixedRoute('settings.whatsapp.test'), {
                phone: testPhone,
                message: testMessage,
            });
            if (res.data && res.data.success) {
                setTestFeedback({
                    type: 'success',
                    message: `✅ Pesan berhasil dikirim ke ${testPhone}! (ID: ${res.data.message_id})`,
                });
                setTestPhone('');
                setTestMessage('');
            } else {
                setTestFeedback({
                    type: 'error',
                    message: `❌ Gagal mengirim pesan: ${res.data.error || 'Terjadi kesalahan.'}`,
                });
            }
        } catch (err: any) {
            setTestFeedback({
                type: 'error',
                message: `❌ Gagal mengirim pesan: ${err?.response?.data?.error || 'Gagal menghubungi server gateway.'}`,
            });
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="WhatsApp Gateway Bisnis"
                    subtitle="Pusat integrasi nomor WhatsApp tenant yang digunakan untuk notifikasi di semua modul CRM (Rental, Invoicing, dll)."
                />
            }
        >
            <Head title="WhatsApp Gateway - Pengaturan Tenant" />

            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            ✓
                        </span>
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Navigation Pill Bar */}
                <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
                    <Link
                        href={prefixedRoute('settings.index')}
                        className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                    >
                        <span>⚙️</span>
                        <span>{t('settings.domain.nav_general')}</span>
                    </Link>
                    <Link
                        href={prefixedRoute('settings.domain')}
                        className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                    >
                        <span>🌐</span>
                        <span>{t('settings.domain.nav_custom_domain')}</span>
                    </Link>
                    <span className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold bg-emerald-600 text-white shadow-sm shrink-0">
                        <span>💬</span>
                        <span>WhatsApp Gateway</span>
                    </span>
                </div>

                {/* Status Koneksi Card */}
                <div
                    className={`rounded-3xl border p-6 shadow-sm transition-all ${
                        status.connected
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-100'
                            : 'border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100'
                    }`}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <span className="relative flex h-4 w-4">
                                <span
                                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                                        status.connected ? 'bg-emerald-400' : 'bg-amber-400'
                                    }`}
                                />
                                <span
                                    className={`relative inline-flex h-4 w-4 rounded-full ${
                                        status.connected ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                />
                            </span>
                            <div>
                                <h3 className="text-base font-bold">
                                    Status Koneksi:{' '}
                                    {status.connected ? (
                                        <span className="text-emerald-700 dark:text-emerald-300">🟢 Terhubung (Online)</span>
                                    ) : (
                                        <span className="text-amber-700 dark:text-amber-300">⚪ Belum Terhubung</span>
                                    )}
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                                    {status.message || 'WhatsApp Gateway siap digunakan untuk menghubungkan nomor CS bisnis Anda.'}
                                </p>
                            </div>
                        </div>

                        {status.connected && (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                        {status.push_name || 'Nomor Bisnis'}
                                    </span>
                                    <span className="block text-xs font-mono text-slate-500">
                                        +{status.phone}
                                    </span>
                                </div>
                                <DangerButton
                                    onClick={handleLogout}
                                    disabled={logoutProcessing}
                                    className="!rounded-xl text-xs py-2"
                                >
                                    {logoutProcessing ? 'Memutuskan…' : 'Putuskan Nomor'}
                                </DangerButton>
                            </div>
                        )}
                    </div>
                </div>

                {/* Jika BELUM TERHUBUNG: Pilihan Pairing */}
                {!status.connected && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Tautkan Nomor WhatsApp Bisnis Anda
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Pilih metode pairing yang paling nyaman untuk Anda.
                            </p>
                        </div>

                        {/* Switch Mode Tab */}
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <button
                                type="button"
                                onClick={() => setPairingMode('qr')}
                                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                    pairingMode === 'qr'
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                📷 Pindai QR Code (Rekomendasi di Laptop)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPairingMode('code')}
                                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                    pairingMode === 'code'
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                🔢 Hubungkan dengan Kode 8-Digit (Praktis di HP)
                            </button>
                        </div>

                        {/* 1. Mode Scan QR */}
                        {pairingMode === 'qr' && (
                            <div className="flex flex-col md:flex-row items-center gap-8 pt-2">
                                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 min-w-[260px] min-h-[260px]">
                                    {qrCode ? (
                                        <div className="space-y-3 text-center">
                                            <img
                                                src={qrCode}
                                                alt="WhatsApp QR Code"
                                                className="w-56 h-56 rounded-xl shadow-sm border border-slate-200 bg-white p-2"
                                            />
                                            <span className="text-[11px] font-semibold text-slate-500 animate-pulse block">
                                                ⏳ Menunggu pemindaian dari HP Anda...
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-3 p-4">
                                            <span className="text-4xl block">📱</span>
                                            <p className="text-xs text-slate-500 max-w-[200px]">
                                                Klik tombol di bawah untuk memunculkan QR Code WhatsApp.
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <PrimaryButton
                                            onClick={handleStartQR}
                                            disabled={loadingQR}
                                            className="!rounded-xl text-xs py-2 shadow-sm"
                                        >
                                            {loadingQR ? 'Memuat QR Code…' : qrCode ? 'Perbarui QR Code' : 'Mulai Tautkan (QR Code)'}
                                        </PrimaryButton>
                                    </div>
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Petunjuk Pemindaian QR:
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        <li>Buka aplikasi <strong>WhatsApp</strong> di ponsel resmi bisnis Anda.</li>
                                        <li>Ketuk menu titik tiga <strong>(⋮)</strong> di Android atau menu <strong>Pengaturan (Settings)</strong> di iPhone.</li>
                                        <li>Pilih <strong>Perangkat Tertaut (Linked Devices)</strong>.</li>
                                        <li>Ketuk tombol <strong>Tautkan Perangkat (Link a Device)</strong>.</li>
                                        <li>Arahkan kamera ponsel Anda ke gambar QR Code di samping.</li>
                                    </ol>
                                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-3 text-xs text-indigo-800 dark:text-indigo-300">
                                        💡 <strong>Aman & Mandiri:</strong> Nomor WhatsApp ini akan tetap terhubung 24/7 dan tersimpan rapi untuk akun tenant Anda.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Mode Pairing Code */}
                        {pairingMode === 'code' && (
                            <div className="space-y-6 pt-2 max-w-xl">
                                <form onSubmit={handleRequestPairCode} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="phone_code" value="Nomor WhatsApp Bisnis Anda" className="!text-xs !font-bold" />
                                        <div className="mt-1 flex gap-2">
                                            <TextInput
                                                id="phone_code"
                                                type="text"
                                                value={phoneForCode}
                                                onChange={(e) => setPhoneForCode(e.target.value)}
                                                placeholder="Contoh: 08123456789 atau 628123456789"
                                                className="w-full !rounded-xl !py-2 text-xs"
                                                required
                                            />
                                            <PrimaryButton
                                                type="submit"
                                                disabled={loadingCode}
                                                className="!rounded-xl text-xs shrink-0 py-2"
                                            >
                                                {loadingCode ? 'Memproses…' : 'Dapatkan Kode'}
                                            </PrimaryButton>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Format: Awali dengan 08 atau 62.
                                        </p>
                                    </div>
                                </form>

                                {pairingCode && (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-center space-y-3 dark:border-emerald-800 dark:bg-emerald-950/40">
                                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                            Masukkan kode ini pada WhatsApp di HP Anda:
                                        </span>
                                        <div className="inline-block rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 px-6 py-3 font-mono text-2xl font-extrabold tracking-widest text-slate-900 dark:text-white shadow-sm">
                                            {pairingCode}
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                                            Buka WhatsApp di HP ➔ <strong>Perangkat Tertaut</strong> ➔ <strong>Tautkan Perangkat</strong> ➔ Pilih <strong>"Tautkan dengan nomor telepon saja"</strong> lalu masukkan kode di atas.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* FORM UJI COBA PENGIRIMAN PESAN */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            🧪 Uji Coba Pengiriman Notifikasi (Test Dispatch)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Kirim pesan uji coba ke nomor Anda sendiri untuk memastikan koneksi WhatsApp berjalan dengan lancar.
                        </p>
                    </div>

                    {testFeedback && (
                        <div
                            className={`rounded-xl p-3.5 text-xs font-medium border ${
                                testFeedback.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                            }`}
                        >
                            {testFeedback.message}
                        </div>
                    )}

                    <form onSubmit={handleSendTest} className="space-y-4 max-w-xl">
                        <div>
                            <InputLabel htmlFor="test_phone" value="Nomor HP Penerima Uji Coba" className="!text-xs !font-bold" />
                            <TextInput
                                id="test_phone"
                                type="text"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                placeholder="081234567890"
                                className="mt-1 block w-full !rounded-xl !py-2 text-xs"
                                required
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="test_message" value="Isi Pesan (Opsional)" className="!text-xs !font-bold" />
                            <TextInput
                                id="test_message"
                                type="text"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                placeholder="Halo, ini pesan uji coba dari Seruwit WA Gateway..."
                                className="mt-1 block w-full !rounded-xl !py-2 text-xs"
                            />
                        </div>

                        <PrimaryButton
                            type="submit"
                            disabled={sendingTest || !status.connected}
                            className="!rounded-xl text-xs py-2 shadow-sm"
                        >
                            {sendingTest ? 'Mengirim Pesan…' : 'Kirim Pesan Tes'}
                        </PrimaryButton>
                        {!status.connected && (
                            <span className="text-xs text-amber-600 block">
                                * Tombol aktif setelah nomor WhatsApp terhubung.
                            </span>
                        )}
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

export interface DeviceStatus {
    connected: boolean;
    status: string;
    phone?: string;
    push_name?: string;
    qr_base64?: string;
    message?: string;
}

interface PlatformSetting {
    id: number;
    key: string;
    group: string;
    value: string | null;
    type: string;
    label: string;
    description: string | null;
    is_public: boolean;
    sort_order: number;
}

interface Props {
    deviceStatus: DeviceStatus | null;
    sessionId?: string | null;
    groupSettings: PlatformSetting[];
    formData: {
        settings: Array<{ id: number; value: string }>;
    };
    updateValue: (index: number, value: string) => void;
    errors: Record<string, string>;
}

export default function CentralWhatsAppPanel({
    deviceStatus: initialStatus,
    sessionId = 'central_platform',
    groupSettings,
    formData,
    updateValue,
    errors,
}: Props): JSX.Element {
    const { t } = useTrans();

    const [status, setStatus] = useState<DeviceStatus>(
        initialStatus ?? {
            connected: false,
            status: 'DISCONNECTED',
            message: 'WhatsApp Central belum terhubung.',
        },
    );

    const [pairingMode, setPairingMode] = useState<'qr' | 'code'>('qr');
    const [loadingQR, setLoadingQR] = useState(false);
    const [qrCode, setQrCode] = useState<string>(initialStatus?.qr_base64 || '');
    const [phoneForCode, setPhoneForCode] = useState('');
    const [pairingCode, setPairingCode] = useState('');
    const [loadingCode, setLoadingCode] = useState(false);

    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [logoutProcessing, setLogoutProcessing] = useState(false);
    const [logoutFeedback, setLogoutFeedback] = useState<string | null>(null);

    const findSettingIndex = (key: string): number => {
        return groupSettings.findIndex((s) => s.key === key);
    };

    const isEnabledIndex = findSettingIndex('whatsapp.is_enabled');
    const isRequirePhoneIndex = findSettingIndex('whatsapp.require_phone_verification');
    const otpCooldownIndex = findSettingIndex('whatsapp.otp_resend_cooldown_seconds');
    const otpTemplateIndex = findSettingIndex('whatsapp.otp_template');
    const isWelcomeEnabledIndex = findSettingIndex('whatsapp.onboarding_welcome_enabled');
    const welcomeTemplateIndex = findSettingIndex('whatsapp.onboarding_welcome_template');
    const providerIndex = findSettingIndex('whatsapp.provider');
    const fonnteTokenIndex = findSettingIndex('whatsapp.fonnte_token');
    const customUrlIndex = findSettingIndex('whatsapp.custom_url');
    const customTokenIndex = findSettingIndex('whatsapp.custom_token');

    const isEnabled = isEnabledIndex >= 0 ? formData.settings[isEnabledIndex]?.value === '1' : false;
    const isRequirePhone = isRequirePhoneIndex >= 0 ? formData.settings[isRequirePhoneIndex]?.value === '1' : true;
    const isWelcomeEnabled = isWelcomeEnabledIndex >= 0 ? formData.settings[isWelcomeEnabledIndex]?.value === '1' : true;
    const currentProvider = providerIndex >= 0 ? formData.settings[providerIndex]?.value || 'seruwit' : 'seruwit';

    // Live polling when QR or pairing code is displayed
    useEffect(() => {
        let timer: any = null;
        if (!status.connected && (qrCode || pairingCode)) {
            timer = setInterval(async () => {
                try {
                    const res = await axios.get(route('module.platform-settings.whatsapp.status'));
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
                } catch {
                    // Ignore transient polling error
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
            const res = await axios.post(route('module.platform-settings.whatsapp.start'));
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
            setTestFeedback({
                type: 'error',
                message: err.response?.data?.error || 'Gagal memulai sesi WhatsApp QR.',
            });
        } finally {
            setLoadingQR(false);
        }
    };

    const handlePairWithCode = async () => {
        if (!phoneForCode) return;
        setLoadingCode(true);
        try {
            const res = await axios.post(route('module.platform-settings.whatsapp.pair'), {
                phone: phoneForCode,
            });
            if (res.data && res.data.success) {
                setPairingCode(res.data.code || '');
            } else {
                setTestFeedback({
                    type: 'error',
                    message: res.data?.error || 'Gagal meminta kode pairing.',
                });
            }
        } catch (err: any) {
            setTestFeedback({
                type: 'error',
                message: err.response?.data?.error || 'Terjadi kesalahan saat meminta kode pairing.',
            });
        } finally {
            setLoadingCode(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Apakah Anda yakin ingin memutuskan koneksi WhatsApp Central?')) {
            return;
        }

        setLogoutProcessing(true);
        try {
            const res = await axios.post(route('module.platform-settings.whatsapp.logout'));
            if (res.data && res.data.success) {
                setStatus({
                    connected: false,
                    status: 'DISCONNECTED',
                    message: 'Nomor WhatsApp berhasil diputuskan.',
                });
                setQrCode('');
                setPairingCode('');
                setLogoutFeedback('Koneksi WhatsApp Central telah diputuskan.');
                router.reload();
            }
        } catch {
            setLogoutFeedback('Gagal memutuskan koneksi WhatsApp.');
        } finally {
            setLogoutProcessing(false);
        }
    };

    const handleSendTest = async () => {
        if (!testPhone) return;
        setSendingTest(true);
        setTestFeedback(null);
        try {
            const res = await axios.post(route('module.platform-settings.whatsapp.test'), {
                phone: testPhone,
                message: testMessage || undefined,
            });
            if (res.data && res.data.success) {
                setTestFeedback({
                    type: 'success',
                    message: res.data.message || 'Pesan uji coba berhasil terkirim ke nomor tujuan.',
                });
            } else {
                setTestFeedback({
                    type: 'error',
                    message: res.data?.error || 'Gagal mengirim pesan uji coba.',
                });
            }
        } catch (err: any) {
            setTestFeedback({
                type: 'error',
                message: err.response?.data?.error || 'Terjadi kesalahan saat mengirim pesan uji coba.',
            });
        } finally {
            setSendingTest(false);
        }
    };

    const insertTemplateVariable = (varName: string) => {
        if (welcomeTemplateIndex < 0) return;
        const current = formData.settings[welcomeTemplateIndex]?.value || '';
        updateValue(welcomeTemplateIndex, `${current} ${varName}`);
    };

    const insertOtpTemplateVariable = (varName: string) => {
        if (otpTemplateIndex < 0) return;
        const current = formData.settings[otpTemplateIndex]?.value || '';
        updateValue(otpTemplateIndex, `${current} ${varName}`);
    };

    return (
        <div className="space-y-6">
            {/* Connection Status Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-xs ${
                                status.connected
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">chat</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('settings.platform.whatsapp.title', undefined, 'Status WhatsApp Gateway Central')}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Sesi ID: <code className="font-mono text-indigo-600 dark:text-indigo-400">{sessionId}</code>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                status.connected
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    status.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                }`}
                            />
                            {status.connected ? 'Terhubung (Online)' : 'Belum Terhubung'}
                        </span>

                        {status.connected && (
                            <DangerButton
                                type="button"
                                onClick={handleLogout}
                                disabled={logoutProcessing}
                                className="!py-1.5 !px-3 !text-xs"
                            >
                                {logoutProcessing ? 'Memutuskan...' : 'Putuskan WhatsApp'}
                            </DangerButton>
                        )}
                    </div>
                </div>

                {logoutFeedback && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                        {logoutFeedback}
                    </div>
                )}

                {/* Connected Info */}
                {status.connected ? (
                    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-start gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
                                ✓
                            </span>
                            <div>
                                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                    WhatsApp Central Siap Mengirim Notifikasi
                                </h4>
                                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                                    {status.message || `Terhubung ke nomor ${status.phone}`}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Pairing Mode Selection */
                    <div className="mt-6 space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setPairingMode('qr')}
                                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    pairingMode === 'qr'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                            >
                                Pindai QR Code
                            </button>
                            <button
                                type="button"
                                onClick={() => setPairingMode('code')}
                                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    pairingMode === 'code'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                            >
                                Kode Pairing 8-Digit
                            </button>
                        </div>

                        {pairingMode === 'qr' && (
                            <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                {qrCode ? (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm inline-block">
                                            <img
                                                src={qrCode}
                                                alt="WhatsApp QR Code"
                                                className="h-56 w-56 object-contain"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                            Buka WhatsApp di ponsel Anda &gt; <strong>Perangkat Tertaut</strong> &gt;{' '}
                                            <strong>Tautkan Perangkat</strong>, lalu arahkan kamera ke kode di atas.
                                        </p>
                                        <SecondaryButton
                                            type="button"
                                            onClick={handleStartQR}
                                            disabled={loadingQR}
                                            className="!text-xs"
                                        >
                                            {loadingQR ? 'Memuat ulang...' : 'Muat Ulang QR'}
                                        </SecondaryButton>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                            <span className="material-symbols-outlined text-[28px]">qr_code_2</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                            Mulai Tautkan Perangkat WhatsApp Central
                                        </h4>
                                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                                            Klik tombol di bawah ini untuk menghasilkan kode QR baru, kemudian scan menggunakan aplikasi WhatsApp ponsel resmi platform.
                                        </p>
                                        <PrimaryButton
                                            type="button"
                                            onClick={handleStartQR}
                                            disabled={loadingQR}
                                            className="!text-xs"
                                        >
                                            {loadingQR ? 'Membuat QR Code...' : 'Tampilkan QR Code'}
                                        </PrimaryButton>
                                    </div>
                                )}
                            </div>
                        )}

                        {pairingMode === 'code' && (
                            <div className="max-w-md space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/20">
                                <div>
                                    <InputLabel value="Nomor WhatsApp Bisnis Central" className="!text-xs" />
                                    <div className="mt-1 flex gap-2">
                                        <TextInput
                                            type="tel"
                                            placeholder="Contoh: 081234567890"
                                            value={phoneForCode}
                                            onChange={(e) => setPhoneForCode(e.target.value)}
                                            className="!text-xs flex-1"
                                        />
                                        <PrimaryButton
                                            type="button"
                                            onClick={handlePairWithCode}
                                            disabled={loadingCode || !phoneForCode}
                                            className="!text-xs"
                                        >
                                            {loadingCode ? 'Meminta...' : 'Minta Kode'}
                                        </PrimaryButton>
                                    </div>
                                </div>

                                {pairingCode && (
                                    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 text-center dark:border-indigo-900/60 dark:bg-indigo-950/40">
                                        <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                                            Masukkan kode ini pada notifikasi WhatsApp ponsel Anda:
                                        </span>
                                        <div className="mt-2 text-2xl font-mono font-black tracking-widest text-indigo-900 dark:text-indigo-200">
                                            {pairingCode}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Test Message Box */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        <span className="material-symbols-outlined text-[20px]">send</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Uji Coba Pengiriman Pesan Central
                        </h3>
                        <p className="text-xs text-slate-500">
                            Kirim pesan percobaan untuk memastikan gateway WhatsApp Central berfungsi normal.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-4 max-w-xl">
                    <div>
                        <InputLabel value="Nomor WhatsApp Penerima Uji Coba *" className="!text-xs" />
                        <TextInput
                            type="tel"
                            placeholder="Contoh: 081234567890"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            className="mt-1 w-full !text-xs"
                        />
                    </div>

                    <div>
                        <InputLabel value="Teks Pesan (Opsional)" className="!text-xs" />
                        <textarea
                            rows={3}
                            placeholder="Pesan kustom atau biarkan kosong untuk pesan default..."
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            className="mt-1 block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                    </div>

                    <PrimaryButton
                        type="button"
                        onClick={handleSendTest}
                        disabled={sendingTest || !testPhone}
                        className="!text-xs"
                    >
                        {sendingTest ? 'Mengirim pesan...' : 'Kirim Pesan Uji Coba'}
                    </PrimaryButton>

                    {testFeedback && (
                        <div
                            className={`rounded-xl p-3 text-xs font-semibold ${
                                testFeedback.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            }`}
                        >
                            {testFeedback.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Automation & Onboarding Configurations */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Otomatisasi Onboarding & Registrasi Tenant Baru
                        </h3>
                        <p className="text-xs text-slate-500">
                            Konfigurasi pengiriman pesan sambutan dan kredensial otomatis saat tenant baru selesai diprovide.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-6">
                    {/* Toggle: Enable WhatsApp Gateway */}
                    {isEnabledIndex >= 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                            <div className="pr-4">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    Aktifkan WhatsApp Gateway Central
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Jika dinonaktifkan, pengiriman pesan platform akan dialihkan ke log tanpa terkirim ke WhatsApp.
                                </p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => updateValue(isEnabledIndex, e.target.checked ? '1' : '0')}
                                    className="peer sr-only"
                                />
                                <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] dark:bg-slate-700" />
                            </label>
                        </div>
                    )}

                    {/* Toggle: Welcome Onboarding Message */}
                    {isWelcomeEnabledIndex >= 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                            <div className="pr-4">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    Kirim Pesan Sambutan Onboarding Otomatis
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Kirim pesan sambutan resmi beserta link akses workspace begitu tenant baru selesai dibuat dan aktif.
                                </p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={isWelcomeEnabled}
                                    onChange={(e) => updateValue(isWelcomeEnabledIndex, e.target.checked ? '1' : '0')}
                                    className="peer sr-only"
                                />
                                <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] dark:bg-slate-700" />
                            </label>
                        </div>
                    )}

                    {/* Toggle: Require Phone Verification */}
                    {isRequirePhoneIndex >= 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                            <div className="pr-4">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    Wajibkan Verifikasi Nomor WhatsApp Tenant
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Jika aktif, setiap pengguna baru wajib memverifikasi nomor WhatsApp via OTP 6-digit sebelum dapat membuat atau mengakses workspace tenant.
                                </p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={isRequirePhone}
                                    onChange={(e) => updateValue(isRequirePhoneIndex, e.target.checked ? '1' : '0')}
                                    className="peer sr-only"
                                />
                                <div className="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] dark:bg-slate-700" />
                            </label>
                        </div>
                    )}

                    {/* OTP Settings when verification is active */}
                    {isRequirePhone && (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-4">
                            {otpCooldownIndex >= 0 && (
                                <div className="max-w-xs">
                                    <InputLabel
                                        value="Waktu Tunggu Kirim Ulang OTP (Detik)"
                                        className="!text-xs !font-bold"
                                    />
                                    <TextInput
                                        type="number"
                                        min="10"
                                        max="600"
                                        value={formData.settings[otpCooldownIndex]?.value || '60'}
                                        onChange={(e) => updateValue(otpCooldownIndex, e.target.value)}
                                        className="mt-1 w-full !text-xs"
                                    />
                                </div>
                            )}

                            {otpTemplateIndex >= 0 && (
                                <div className="space-y-3">
                                    <InputLabel
                                        value="Format Template Pesan OTP WhatsApp"
                                        className="!text-xs !font-bold"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Klik tag variabel di bawah untuk menyisipkan ke dalam pesan:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { label: 'Nama Pengguna', var: '{user_name}' },
                                            { label: 'Kode OTP 6-Digit', var: '{code}' },
                                            { label: 'Masa Berlaku (Menit)', var: '{expiry_minutes}' },
                                        ].map((item) => (
                                            <button
                                                key={item.var}
                                                type="button"
                                                onClick={() => insertOtpTemplateVariable(item.var)}
                                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-mono font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                + {item.var} ({item.label})
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={formData.settings[otpTemplateIndex]?.value || ''}
                                        onChange={(e) => updateValue(otpTemplateIndex, e.target.value)}
                                        className="block w-full rounded-2xl border border-slate-200/80 bg-white p-3.5 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Template Editor */}
                    {welcomeTemplateIndex >= 0 && (
                        <div className="space-y-3">
                            <InputLabel
                                value="Format Template Pesan Sambutan Onboarding"
                                className="!text-xs !font-bold"
                            />
                            <p className="text-xs text-slate-500">
                                Klik tag variabel di bawah untuk menyisipkan ke dalam pesan:
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { label: 'Nama Pemilik', var: '{owner_name}' },
                                    { label: 'Nama Perusahaan', var: '{company_name}' },
                                    { label: 'URL Workspace', var: '{workspace_url}' },
                                    { label: 'Email Login', var: '{email}' },
                                    { label: 'Nama Paket', var: '{plan_name}' },
                                    { label: 'Subdomain', var: '{subdomain}' },
                                ].map((item) => (
                                    <button
                                        key={item.var}
                                        type="button"
                                        onClick={() => insertTemplateVariable(item.var)}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-mono font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        + {item.var} ({item.label})
                                    </button>
                                ))}
                            </div>

                            <textarea
                                rows={7}
                                value={formData.settings[welcomeTemplateIndex]?.value || ''}
                                onChange={(e) => updateValue(welcomeTemplateIndex, e.target.value)}
                                className="block w-full rounded-2xl border border-slate-200/80 bg-white p-3.5 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            />
                            <InputError
                                message={errors[`settings.${welcomeTemplateIndex}.value`]}
                                className="mt-1"
                            />
                        </div>
                    )}

                    {/* Provider Choice */}
                    {providerIndex >= 0 && (
                        <div className="border-t border-slate-100 pt-6 dark:border-slate-800 space-y-4">
                            <div>
                                <InputLabel value="Provider WhatsApp Gateway Central" className="!text-xs !font-bold" />
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'seruwit', name: 'Seruwit WA Gateway (Direkomendasikan)', desc: 'Multi-device Baileys Microservice' },
                                        { id: 'fonnte', name: 'Fonnte', desc: 'Fonnte Cloud API' },
                                        { id: 'custom', name: 'Custom Webhook', desc: 'Custom HTTP Webhook Endpoint' },
                                    ].map((prov) => (
                                        <button
                                            key={prov.id}
                                            type="button"
                                            onClick={() => updateValue(providerIndex, prov.id)}
                                            className={`rounded-2xl border p-3.5 text-left transition-all ${
                                                currentProvider === prov.id
                                                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-200'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="font-bold text-xs">{prov.name}</div>
                                            <div className="text-[11px] text-slate-500 mt-1">{prov.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {currentProvider === 'fonnte' && fonnteTokenIndex >= 0 && (
                                <div className="mt-3">
                                    <InputLabel value="Fonnte API Token" className="!text-xs" />
                                    <TextInput
                                        type="password"
                                        value={formData.settings[fonnteTokenIndex]?.value || ''}
                                        onChange={(e) => updateValue(fonnteTokenIndex, e.target.value)}
                                        placeholder="Masukkan token akun Fonnte Anda..."
                                        className="mt-1 w-full !text-xs"
                                    />
                                </div>
                            )}

                            {currentProvider === 'custom' && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {customUrlIndex >= 0 && (
                                        <div>
                                            <InputLabel value="Custom Endpoint URL" className="!text-xs" />
                                            <TextInput
                                                type="url"
                                                value={formData.settings[customUrlIndex]?.value || ''}
                                                onChange={(e) => updateValue(customUrlIndex, e.target.value)}
                                                placeholder="https://api.mygateway.com/send"
                                                className="mt-1 w-full !text-xs"
                                            />
                                        </div>
                                    )}
                                    {customTokenIndex >= 0 && (
                                        <div>
                                            <InputLabel value="Bearer Token (Opsional)" className="!text-xs" />
                                            <TextInput
                                                type="password"
                                                value={formData.settings[customTokenIndex]?.value || ''}
                                                onChange={(e) => updateValue(customTokenIndex, e.target.value)}
                                                placeholder="Authorization token..."
                                                className="mt-1 w-full !text-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

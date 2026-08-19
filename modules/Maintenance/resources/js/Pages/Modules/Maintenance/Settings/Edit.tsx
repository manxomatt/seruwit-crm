import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';

interface Settings {
    alert_km_before: string;
    alert_days_before: string;
    auto_create_wo: boolean;
    single_active_wo_per_vehicle: boolean;
    single_active_wo_per_bay: boolean;
    ai_predictive_maintenance_enabled: boolean;
}

interface Props {
    settings: Settings;
    centralAiEnabled?: boolean;
}

export default function Edit({ settings, centralAiEnabled = true }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        alert_km_before: settings.alert_km_before,
        alert_days_before: settings.alert_days_before,
        auto_create_wo: settings.auto_create_wo,
        single_active_wo_per_vehicle: settings.single_active_wo_per_vehicle,
        single_active_wo_per_bay: settings.single_active_wo_per_bay,
        ai_predictive_maintenance_enabled: settings.ai_predictive_maintenance_enabled ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('maintenance.settings.update'), { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Pengaturan Maintenance & Fleet"
                    subtitle="Konfigurasi ambang batas peringatan servis, batasan alur pengerjaan SPK, serta integrasi AI Predictive Maintenance."
                />
            }
        >
            <Head title="Pengaturan · Maintenance" />
            <MaintenanceNav />

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                <form onSubmit={submit} className="space-y-6">
                    {/* Card 1: Ambang Batas Peringatan */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">1</span>
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-white">Ambang Batas Peringatan Servis (Alert Thresholds)</h2>
                                <p className="text-xs text-slate-500">Batas awal sebelum jadwal servis dianggap mendesak (due / overdue).</p>
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                                <InputLabel htmlFor="alert_km_before" value="Toleransi Jarak Tempuh Peringatan (Km)" />
                                <div className="relative mt-2">
                                    <TextInput
                                        id="alert_km_before"
                                        type="number"
                                        min={0}
                                        className="block w-full !rounded-2xl font-mono text-sm shadow-2xs pr-12"
                                        value={data.alert_km_before}
                                        onChange={(e) => setData('alert_km_before', e.target.value)}
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-400">
                                        Km
                                    </span>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-400">Peringatan servis akan aktif X km sebelum batas kilometer jadwal.</p>
                                <InputError message={errors.alert_km_before} className="mt-1" />
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                                <InputLabel htmlFor="alert_days_before" value="Toleransi Hari Peringatan (Hari)" />
                                <div className="relative mt-2">
                                    <TextInput
                                        id="alert_days_before"
                                        type="number"
                                        min={0}
                                        className="block w-full !rounded-2xl font-mono text-sm shadow-2xs pr-12"
                                        value={data.alert_days_before}
                                        onChange={(e) => setData('alert_days_before', e.target.value)}
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-400">
                                        Hari
                                    </span>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-400">Peringatan servis akan aktif X hari sebelum tanggal jatuh tempo jadwal.</p>
                                <InputError message={errors.alert_days_before} className="mt-1" />
                            </div>
                        </div>
                    </section>

                    {/* Card 2: Aturan & Alur Kerja SPK */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">2</span>
                            <div>
                                <h2 className="text-base font-black text-slate-900 dark:text-white">Aturan & Alur Kerja Surat Perintah Kerja (SPK)</h2>
                                <p className="text-xs text-slate-500">Batasan otomatisasi pembuatan SPK dan pencegahan konflik lokasi/kendaraan.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/50 cursor-pointer">
                                <Checkbox
                                    checked={data.auto_create_wo}
                                    onChange={(e) => setData('auto_create_wo', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="block text-xs font-black text-slate-900 dark:text-white">
                                        Otomatis Buat SPK saat Jadwal Servis Terpenuhi (Due)
                                    </span>
                                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Sistem akan membuatkan Draft SPK secara otomatis ketika kendaraan mencapai batas odometer km atau tanggal jatuh tempo.
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/50 cursor-pointer">
                                <Checkbox
                                    checked={data.single_active_wo_per_vehicle}
                                    onChange={(e) => setData('single_active_wo_per_vehicle', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="block text-xs font-black text-slate-900 dark:text-white">
                                        Batasi Maksimal 1 SPK Aktif per Kendaraan
                                    </span>
                                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Mencegah pembuatan SPK baru untuk kendaraan yang masih memiliki SPK aktif berjalan di bengkel.
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/50 cursor-pointer">
                                <Checkbox
                                    checked={data.single_active_wo_per_bay}
                                    onChange={(e) => setData('single_active_wo_per_bay', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="block text-xs font-black text-slate-900 dark:text-white">
                                        Batasi Maksimal 1 Kendaraan per Bay Bengkel
                                    </span>
                                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Mencegah alokasi dua unit kendaraan bersamaan di stall/bay perbaikan yang sama.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </section>

                    {/* Card 3: Fitur AI Predictive Maintenance */}
                    {centralAiEnabled && (
                        <section className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-6 shadow-xs dark:border-indigo-900/50 dark:bg-slate-900 space-y-6">
                            <div className="flex items-center gap-3 border-b border-indigo-100 pb-4 dark:border-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-base font-black text-white shadow-md">
                                    ✨
                                </span>
                                <div>
                                    <h2 className="text-base font-black text-slate-900 dark:text-white">Fitur Kecerdasan Buatan (AI Predictive Maintenance)</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Prediksi kerusakan berbasis analitik AI, skor kesehatan unit, dan deteksi anomali.</p>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-start gap-3.5 rounded-2xl border border-indigo-200/60 bg-white/90 p-4 transition hover:bg-white dark:border-slate-800 dark:bg-slate-850/80 cursor-pointer shadow-2xs">
                                    <Checkbox
                                        checked={data.ai_predictive_maintenance_enabled}
                                        onChange={(e) => setData('ai_predictive_maintenance_enabled', e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded-md border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="block text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>Aktifkan AI Predictive Maintenance & Anomaly Detection</span>
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                AI Powered
                                            </span>
                                        </span>
                                        <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Mengaktifkan rekomendasi prediksi tanggal & odometer servis berbasis laju pemakaian harian, deteksi anomali BBM/perbaikan, serta skor kalkulasi risiko kesehatan armada secara otomatis.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </section>
                    )}

                    {/* Inline Panel Footer Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            {recentlySuccessful ? (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    ✓ Pengaturan Berhasil Disimpan
                                </span>
                            ) : (
                                <p className="text-xs text-slate-500 dark:text-slate-400">Pastikan semua parameter pengaturan sudah sesuai sebelum menyimpan.</p>
                            )}
                        </div>

                        <PrimaryButton
                            type="submit"
                            disabled={processing}
                            className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md"
                        >
                            {processing ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

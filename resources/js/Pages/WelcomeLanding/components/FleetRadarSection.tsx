import React from 'react';
import { useTrans } from '@/hooks/useTrans';

const FleetRadarSection: React.FC = () => {
  const { t } = useTrans();

  return (
    <section id="armada" className="py-20 sm:py-24 bg-slate-50 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left: Text & Features List */}
          <div className="space-y-6 lg:col-span-5">
            <span className="inline-block rounded-full bg-cyan-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-cyan-800 border border-cyan-200">
              {t('landing.fleet_section.tag', undefined, 'Pilar Flagship 02')}
            </span>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight">
              {t('landing.fleet_section.title', undefined, 'Kendali Penuh Atas Armada, Dokumen & Driver')}
            </h2>

            <p className="text-base text-slate-600 leading-relaxed">
              {t('landing.fleet_section.subtitle', undefined, 'Tidak ada lagi denda STNK telat, jadwal servis terlewat, atau ketidaktahuan rute perjalanan kendaraan sewa Anda.')}
            </p>

            <div className="space-y-4 pt-2">
              {/* Feature 1 */}
              <div className="flex items-start gap-3.5 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold border border-teal-200">
                  <span className="material-symbols-outlined text-[22px]">my_location</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {t('landing.fleet_section.gps_title', undefined, 'Live GPS Telematics & Radar')}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {t('landing.fleet_section.gps_desc', undefined, 'Integrasi pelacakan posisi GPS riil dan alarm peringatan otomatis saat mobil keluar dari batas wilayah kota sewa.')}
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3.5 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
                  <span className="material-symbols-outlined text-[22px]">notifications_active</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {t('landing.fleet_section.tax_title', undefined, 'Pengingat Pajak, STNK & KIR')}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {t('landing.fleet_section.tax_desc', undefined, 'Notifikasi otomatis H-30 sebelum masa pajak tahunan, 5 tahunan, asuransi all-risk, atau uji KIR armada habis.')}
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3.5 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  <span className="material-symbols-outlined text-[22px]">badge</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {t('landing.fleet_section.driver_title', undefined, 'Manajemen Driver & Komisi')}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {t('landing.fleet_section.driver_desc', undefined, 'Penugasan sopir per trip, pencatatan uang saku/jalan, serta rekap komisi driver yang terhitung transparan.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Mockup Cards Showcase */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xl shadow-slate-900/5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Fleet Health & Compliance Monitor
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">Real-Time Sync</span>
              </div>

              {/* STNK Expiry Alert Card */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-xl font-bold">
                    ⚠️
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">
                      Pajero Sport (B 9912 DAK) — Pajak Tahunan Jatuh Tempo
                    </h5>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Sisa 14 hari lagi • Notifikasi WhatsApp terkirim ke Admin Ops
                    </p>
                  </div>
                </div>
                <span className="rounded-xl bg-white px-3 py-1 text-xs font-extrabold text-amber-800 shadow-xs border border-amber-200 whitespace-nowrap">
                  Perbarui
                </span>
              </div>

              {/* Live Vehicle on Route */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 text-xl font-bold">
                    🚗
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">
                      Innova Zenix (B 1042 SER) — Rute Tol Trans-Jawa KM 72
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Kecepatan: 84 km/jam • Kontak: Mesin Nyala • GPS Signal 100%
                    </p>
                  </div>
                </div>
                <span className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  Normal
                </span>
              </div>

              {/* Maintenance Log Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 text-xl font-bold">
                    🔧
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">
                      HiAce Premio (B 7721 TRV) — Servis Berkala 40.000 KM Selesai
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ganti oli mesin, kampas rem, filter udara • Biaya: Rp 1.850.000 (Tercatat ke Ledger)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">Kemarin</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FleetRadarSection;

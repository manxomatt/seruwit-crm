import React, { useState } from 'react';

type ConsoleTab = 'dispatch' | 'telemetry' | 'finance';

const HeroCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('dispatch');
  const [selectedRentalType, setSelectedRentalType] = useState<string>('all');

  const dispatchVehicles = [
    {
      id: 'zenix',
      name: 'Innova Zenix Hybrid',
      plate: 'B 1042 SER',
      type: 'Lepas Kunci',
      fuel: '88% • Hybrid',
      status: 'Sedang Disewa',
      statusTone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      dotTone: 'bg-emerald-500',
      tenant: 'PT Nusantara Mandiri',
      period: '28 Sep – 01 Okt (3 Hari)',
      amount: 'Rp 2.850.000 • Lunas QRIS',
      deposit: 'Deposit Rp 1.5M Aman',
      barWidth: 'w-4/5',
      barGradient: 'from-teal-600 to-emerald-600',
    },
    {
      id: 'hiace',
      name: 'Toyota HiAce Premio 14-Seat',
      plate: 'B 7721 TRV',
      type: 'Shuttle + Driver',
      fuel: 'Solar • 74%',
      status: 'Dalam Rute',
      statusTone: 'bg-sky-50 text-sky-700 ring-sky-600/20',
      dotTone: 'bg-sky-500',
      tenant: 'Rute Bandung Express (Driver: Hendra)',
      period: '07:30 – 18:00 (Hari Ini)',
      amount: 'Rp 2.100.000 • Lunas VA BCA',
      deposit: 'SOP Driver Terverifikasi',
      barWidth: 'w-3/5',
      barGradient: 'from-sky-600 to-indigo-600',
    },
    {
      id: 'pajero',
      name: 'Mitsubishi Pajero Sport Dakar',
      plate: 'B 9912 DAK',
      type: 'VIP Charter',
      fuel: 'Solar • Penuh',
      status: 'Siap Jalan',
      statusTone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      dotTone: 'bg-emerald-500',
      tenant: 'Inspeksi & Cuci Bersih Selesai',
      period: 'Slot Bebas Booking (Zero Conflict)',
      amount: 'Tersedia Sekarang',
      deposit: 'Tarif Rp 1.200.000/hari',
      barWidth: 'w-1/4',
      barGradient: 'from-slate-300 to-slate-400',
    },
    {
      id: 'stargazer',
      name: 'Hyundai Stargazer Prime',
      plate: 'B 3319 GZ',
      type: 'Lepas Kunci',
      fuel: 'Bensin • 90%',
      status: 'Booking Besok',
      statusTone: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      dotTone: 'bg-amber-500',
      tenant: 'Bpk. Ridwan Fauzi (Liburan Keluarga)',
      period: '29 Sep – 02 Okt (3 Hari)',
      amount: 'Invoice Terbit • DP Masuk',
      deposit: 'Dokumen KTP & SIM Valid ✓',
      barWidth: 'w-1/2',
      barGradient: 'from-amber-500 to-teal-600',
    },
  ];

  const telemetryVehicles = [
    {
      name: 'Innova Zenix Hybrid',
      plate: 'B 1042 SER',
      location: 'Tol Jagorawi KM 34 (Arah Bogor)',
      speed: '84 km/jam',
      driver: 'Lepas Kunci (Penyewa Utama: Budi Santoso)',
      geofence: 'Dalam Koridor Izin Jawa Barat',
      telemetry: 'Mesin Normal • Suhu 88°C • Baterai Hybrid 82%',
      badge: 'Jalur Hijau',
      badgeTone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Toyota HiAce Premio',
      plate: 'B 7721 TRV',
      location: 'Tol Cipularang KM 72 (Arah Bandung)',
      speed: '76 km/jam',
      driver: 'Driver: Hendra Kusuma (Rating 4.9)',
      geofence: 'Rute Shuttle Resmi JKT-BDG',
      telemetry: 'Rest Area Stop 15 mnt lalu • Odometer: 42.180 KM',
      badge: 'Rute Aktif',
      badgeTone: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      name: 'Mitsubishi Pajero Sport',
      plate: 'B 9912 DAK',
      location: 'Pool Utama Seruwit (Jakarta Selatan)',
      speed: '0 km/jam (Parkir)',
      driver: 'Kunci di Brankas Operasional',
      geofence: 'Geofence Safe Zone • Siap Serah Terima',
      telemetry: 'Pajak STNK: Aktif s/d Nov 2027 • Servis Rutin OK',
      badge: 'Standby Unit',
      badgeTone: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  const financialItems = [
    {
      unit: 'Innova Zenix Hybrid (B 1042 SER)',
      period: 'Bulan Berjalan (September)',
      income: 'Rp 18.500.000',
      expenses: 'Rp 2.400.000 (Servis berkala & asuransi)',
      depositHeld: 'Rp 1.500.000 (Terkunci)',
      netProfit: 'Rp 16.100.000',
      margin: '87% Net Margin',
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      unit: 'Toyota HiAce Premio (B 7721 TRV)',
      period: 'Bulan Berjalan (September)',
      income: 'Rp 34.200.000',
      expenses: 'Rp 9.800.000 (BBM, tol & honor driver)',
      depositHeld: 'Rp 3.000.000 (Terkunci)',
      netProfit: 'Rp 24.400.000',
      margin: '71% Net Margin',
      tone: 'text-sky-700 bg-sky-50',
    },
    {
      unit: 'Mitsubishi Pajero Sport (B 9912 DAK)',
      period: 'Bulan Berjalan (September)',
      income: 'Rp 22.000.000',
      expenses: 'Rp 3.100.000 (Ganti oli & salon mobil)',
      depositHeld: 'Rp 2.000.000 (Terkunci)',
      netProfit: 'Rp 18.900.000',
      margin: '86% Net Margin',
      tone: 'text-teal-700 bg-teal-50',
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      {/* Precision Frame with Technical Elevation */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-all">
        
        {/* Cockpit Command Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          
          {/* Left: Active Telemetry Tag & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="tracking-wide">FLEET CONSOLE</span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('dispatch')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'dispatch'
                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                <span>Matriks Dispatch</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('telemetry')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'telemetry'
                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">explore</span>
                <span>Radar GPS & Rute</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'finance'
                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">monitoring</span>
                <span>P&L per Unit</span>
              </button>
            </div>
          </div>

          {/* Right: Live Telemetry Metrics */}
          <div className="hidden items-center gap-4 text-xs font-bold text-slate-600 lg:flex">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Armada Aktif:</span>
              <span className="font-extrabold text-slate-900">24/26 Unit (92%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              <span className="text-slate-400">Omset:</span>
              <span className="font-extrabold text-slate-900">Rp 148.5M</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-slate-400">Jaminan Deposit:</span>
              <span className="font-extrabold text-slate-900">Rp 28M Aman</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Matriks Dispatch & Jadwal Rental (Interactive Gantt) */}
        {activeTab === 'dispatch' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  Jadwal Dispatch & Reservasi Armada
                </h3>
                <p className="text-xs text-slate-500">
                  Sinkronisasi visual waktu-nyata. Mencegah bentrok jadwal & memastikan serah-terima unit tepat waktu.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">
                  ✓ Anti-Bentrok Aktif
                </span>
                <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-teal-700 border border-teal-200">
                  SPK Otomatis
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {dispatchVehicles.map((v) => (
                <div
                  key={v.id}
                  className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-all hover:border-teal-200 hover:bg-white hover:shadow-md"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {/* Unit Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs border border-slate-200/80 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 transition">
                        <span className="material-symbols-outlined text-[20px]">directions_car</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-sm font-extrabold text-slate-900">
                            {v.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {v.plate}
                          </span>
                          <span className="hidden sm:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {v.fuel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          <strong className="text-slate-800">{v.tenant}</strong> &bull; {v.period}
                        </p>
                      </div>
                    </div>

                    {/* Status & Financial Details */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${v.statusTone}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${v.dotTone}`} />
                        {v.status}
                      </span>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-slate-900">{v.amount}</p>
                        <p className="text-[11px] font-semibold text-emerald-600">{v.deposit}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Schedule Timeline Bar */}
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${v.barGradient} ${v.barWidth}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Radar GPS & Telemetri Live */}
        {activeTab === 'telemetry' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  Radar GPS & Pengawasan Rute Aktif
                </h3>
                <p className="text-xs text-slate-500">
                  Pantau posisi real-time, geofence batas area sewa, dan pengingat STNK kendaraan.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                Live GPS Sync 10s
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {telemetryVehicles.map((t) => (
                <div
                  key={t.plate}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-md hover:border-sky-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-600">{t.plate}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${t.badgeTone}`}>
                      {t.badge}
                    </span>
                  </div>
                  <h4 className="font-heading text-sm font-extrabold text-slate-900">{t.name}</h4>
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-teal-600">location_on</span>
                      <span className="font-semibold text-slate-800 truncate">{t.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-sky-600">speed</span>
                      <span>Kecepatan: <strong>{t.speed}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">person</span>
                      <span className="truncate">{t.driver}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] font-medium text-slate-500">
                    {t.telemetry}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Akuntansi & P&L Unit */}
        {activeTab === 'finance' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  Laporan Laba-Rugi (P&L) per Unit Mobil
                </h3>
                <p className="text-xs text-slate-500">
                  Audit otomatis perbandingan omset sewa vs biaya operasional (BBM, servis, asuransi, honor driver).
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Auto-Ledger & Invoice QRIS
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50">
              {financialItems.map((f) => (
                <div
                  key={f.unit}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition hover:bg-white"
                >
                  <div>
                    <h4 className="font-heading text-sm font-extrabold text-slate-900">{f.unit}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Omset: <span className="font-semibold text-slate-800">{f.income}</span> &bull; Beban: <span className="text-rose-600">{f.expenses}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{f.netProfit}</p>
                      <p className="text-[11px] font-semibold text-emerald-600">{f.margin}</p>
                    </div>
                    <span className="rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-extrabold text-teal-800 border border-teal-200 whitespace-nowrap">
                      {f.depositHeld}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Console Technical Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:px-6 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="material-symbols-outlined text-[16px] text-teal-600">verified_user</span>
              Screening Dokumen & Validasi Masa Berlaku SIM
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-500">
              Multi-Tenant Isolated DB Architecture
            </span>
          </div>
          <div className="mt-1 sm:mt-0 flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>UPTIME: 99.9%</span>
            <span>&bull;</span>
            <span>LATENCY: 24ms</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroCommandCenter;

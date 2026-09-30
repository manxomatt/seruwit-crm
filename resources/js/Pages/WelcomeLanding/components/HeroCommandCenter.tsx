import React, { useState } from 'react';
import { useTrans } from '@/hooks/useTrans';

type ConsoleTab = 'dispatch' | 'telemetry' | 'finance';

const HeroCommandCenter: React.FC = () => {
  const { t } = useTrans();
  const [activeTab, setActiveTab] = useState<ConsoleTab>('dispatch');

  const dispatchVehicles = [
    {
      id: 'zenix',
      name: t('landing.hero.console.dispatch.unit1_name', undefined, 'Innova Zenix Hybrid'),
      plate: 'B 1042 SER',
      details: t('landing.hero.console.dispatch.unit1_details', undefined, 'Lepas Kunci • PT Nusantara Mandiri (s/d 01 Okt)'),
      status: t('landing.hero.console.dispatch.unit1_status', undefined, 'Sedang Disewa'),
      statusTone: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      dotTone: 'bg-emerald-500',
      revenue: t('landing.hero.console.dispatch.unit1_rev', undefined, 'Rp 2.85M (Lunas)'),
      deposit: t('landing.hero.console.dispatch.unit1_sub', undefined, 'Deposit Rp 1.5M Aman'),
    },
    {
      id: 'hiace',
      name: t('landing.hero.console.dispatch.unit2_name', undefined, 'Toyota HiAce Premio'),
      plate: 'B 7721 TRV',
      details: t('landing.hero.console.dispatch.unit2_details', undefined, 'Shuttle • Rute: JKT → BDG (Driver: Hendra)'),
      status: t('landing.hero.console.dispatch.unit2_status', undefined, 'Dalam Rute'),
      statusTone: 'bg-sky-50 text-sky-700 ring-sky-600/20',
      dotTone: 'bg-sky-500',
      revenue: t('landing.hero.console.dispatch.unit2_rev', undefined, 'Rp 2.10M (Lunas)'),
      deposit: t('landing.hero.console.dispatch.unit2_sub', undefined, 'GPS: KM 72 Cipularang'),
    },
    {
      id: 'pajero',
      name: t('landing.hero.console.dispatch.unit3_name', undefined, 'Mitsubishi Pajero Sport'),
      plate: 'B 9912 DAK',
      details: t('landing.hero.console.dispatch.unit3_details', undefined, 'VIP Charter • Inspeksi & Cuci Selesai'),
      status: t('landing.hero.console.dispatch.unit3_status', undefined, 'Siap Jalan'),
      statusTone: 'bg-slate-100 text-slate-700 ring-slate-400/20',
      dotTone: 'bg-slate-400',
      revenue: t('landing.hero.console.dispatch.unit3_rev', undefined, 'Tersedia Sekarang'),
      deposit: t('landing.hero.console.dispatch.unit3_sub', undefined, 'Tarif Rp 1.2M/hari'),
    },
  ];

  const telemetryVehicles = [
    {
      name: t('landing.hero.console.dispatch.unit1_name', undefined, 'Innova Zenix Hybrid'),
      plate: 'B 1042 SER',
      location: t('landing.hero.console.telemetry.unit1_loc', undefined, 'Tol Jagorawi KM 34 (Arah Bogor)'),
      speed: t('landing.hero.console.telemetry.unit1_speed', undefined, '84 km/jam'),
      driver: t('landing.hero.console.telemetry.unit1_driver', undefined, 'Lepas Kunci (Budi Santoso)'),
      status: t('landing.hero.console.telemetry.unit1_status', undefined, 'Jalur Hijau'),
      statusTone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: t('landing.hero.console.dispatch.unit2_name', undefined, 'Toyota HiAce Premio'),
      plate: 'B 7721 TRV',
      location: t('landing.hero.console.telemetry.unit2_loc', undefined, 'Tol Cipularang KM 72 (Arah Bandung)'),
      speed: t('landing.hero.console.telemetry.unit2_speed', undefined, '76 km/jam'),
      driver: t('landing.hero.console.telemetry.unit2_driver', undefined, 'Driver: Hendra Kusuma'),
      status: t('landing.hero.console.telemetry.unit2_status', undefined, 'Rute Aktif'),
      statusTone: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      name: t('landing.hero.console.dispatch.unit3_name', undefined, 'Mitsubishi Pajero Sport'),
      plate: 'B 9912 DAK',
      location: t('landing.hero.console.telemetry.unit3_loc', undefined, 'Pool Utama (Jakarta Selatan)'),
      speed: t('landing.hero.console.telemetry.unit3_speed', undefined, 'Parkir (Standby)'),
      driver: t('landing.hero.console.telemetry.unit3_driver', undefined, 'Kunci di Brankas'),
      status: t('landing.hero.console.telemetry.unit3_status', undefined, 'Siap Booking'),
      statusTone: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  const financialItems = [
    {
      unit: 'Innova Zenix Hybrid (B 1042 SER)',
      period: 'Bulan Berjalan',
      income: 'Rp 18.5M',
      expense: 'Rp 2.4M',
      netProfit: 'Rp 16.1M',
      margin: '87% Margin',
    },
    {
      unit: 'Toyota HiAce Premio (B 7721 TRV)',
      period: 'Bulan Berjalan',
      income: 'Rp 34.2M',
      expense: 'Rp 9.8M',
      netProfit: 'Rp 24.4M',
      margin: '71% Margin',
    },
    {
      unit: 'Mitsubishi Pajero Sport (B 9912 DAK)',
      period: 'Bulan Berjalan',
      income: 'Rp 22.0M',
      expense: 'Rp 3.1M',
      netProfit: 'Rp 18.9M',
      margin: '86% Margin',
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Clean Elevated Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5 transition-all">
        
        {/* Sleek Top Navigation Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          
          {/* Interactive Mode Tabs */}
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
              <span>{t('landing.hero.console.tab_dispatch', undefined, 'Jadwal Dispatch')}</span>
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
              <span>{t('landing.hero.console.tab_telemetry', undefined, 'Radar GPS')}</span>
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
              <span>{t('landing.hero.console.tab_finance', undefined, 'P&L per Unit')}</span>
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold text-slate-900">
                {t('landing.hero.console.active_units', undefined, '24/26 Unit')}
              </span>
              <span className="text-slate-400 font-normal">
                {t('landing.hero.console.active_label', undefined, 'Aktif')}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span className="font-extrabold text-slate-900">
                {t('landing.hero.console.revenue_val', undefined, 'Rp 148.5M')}
              </span>
              <span className="text-slate-400 font-normal ml-1">
                {t('landing.hero.console.revenue_label', undefined, 'Omset')}
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Jadwal Dispatch (Clean Rows without Heavy Progress Bars) */}
        {activeTab === 'dispatch' && (
          <div className="divide-y divide-slate-100 bg-white p-2 sm:p-4">
            {dispatchVehicles.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3.5 transition hover:bg-slate-50/80"
              >
                {/* Unit & Booking Info */}
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <span className="material-symbols-outlined text-[20px]">directions_car</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-slate-900">
                        {v.name}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {v.plate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.details}</p>
                  </div>
                </div>

                {/* Status & Financial Info */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${v.statusTone}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${v.dotTone}`} />
                    {v.status}
                  </span>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{v.revenue}</p>
                    <p className="text-[11px] font-medium text-slate-500">{v.deposit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Radar GPS & Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 sm:p-5 bg-white">
            {telemetryVehicles.map((tItem) => (
              <div
                key={tItem.plate}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{tItem.plate}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tItem.statusTone}`}>
                    {tItem.status}
                  </span>
                </div>
                <h4 className="font-heading text-sm font-bold text-slate-900">{tItem.name}</h4>
                <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                  <p className="truncate">📍 {tItem.location}</p>
                  <p>⚡ {tItem.speed}</p>
                  <p className="truncate text-slate-500">👤 {tItem.driver}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: P&L per Unit Mobil */}
        {activeTab === 'finance' && (
          <div className="divide-y divide-slate-100 p-2 sm:p-4 bg-white">
            {financialItems.map((f) => (
              <div
                key={f.unit}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3.5 transition hover:bg-slate-50/80"
              >
                <div>
                  <h4 className="font-heading text-sm font-bold text-slate-900">{f.unit}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('landing.hero.console.finance.revenue_label', undefined, 'Omset')}:{' '}
                    <span className="font-semibold text-slate-800">{f.income}</span> &bull;{' '}
                    {t('landing.hero.console.finance.expense_label', undefined, 'Beban')}:{' '}
                    <span className="text-slate-500">{f.expense}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{f.netProfit}</p>
                    <p className="text-[11px] font-semibold text-emerald-600">{f.margin}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clean Integrated Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              {t('landing.hero.console.footer_text', undefined, 'Zero-Conflict Scheduling • Auto-SPK • Screening Dokumen Valid')}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 sm:mt-0">
            {t('landing.hero.console.sla_uptime', undefined, 'SLA Uptime: 99.9%')}
          </span>
        </div>

      </div>
    </div>
  );
};

export default HeroCommandCenter;


import React from 'react';

interface Settings {
  'general.site_tagline'?: string;
  'general.site_description'?: string;
  [key: string]: string | undefined;
}

interface HeroProps {
  settings?: Settings;
}

const pipelineStages = [
  { label: 'Prospek', count: 48, width: 'w-full', color: 'bg-sky-200' },
  { label: 'Negosiasi', count: 26, width: 'w-3/4', color: 'bg-sky-300' },
  { label: 'Penawaran', count: 14, width: 'w-1/2', color: 'bg-sky-400' },
  { label: 'Deal', count: 9, width: 'w-1/3', color: 'bg-sky-500' },
];

const Hero: React.FC<HeroProps> = ({ settings }) => {
  const tagline = settings?.['general.site_tagline'] || 'Kelola pelanggan, pipeline, dan tim penjualan Anda dalam satu platform yang sederhana.';

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute bottom-0 -left-32 h-80 w-80 rounded-full bg-sky-50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-600 ring-1 ring-inset ring-sky-100">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              CRM modern untuk bisnis yang bertumbuh
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Bangun Hubungan Pelanggan yang{' '}
              <span className="text-sky-500">Lebih Dekat</span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-500 lg:mx-0">
              {tagline}
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-600"
              >
                Mulai Gratis
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                </svg>
              </a>
              <a
                href="#fitur"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-600"
              >
                Lihat Fitur
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 lg:justify-start">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tanpa kartu kredit
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Siap pakai dalam 5 menit
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Pipeline Penjualan</p>
                  <p className="text-2xl font-bold text-slate-900">Rp 128,5 jt</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  +18% bulan ini
                </span>
              </div>

              <div className="space-y-4">
                {pipelineStages.map((stage) => (
                  <div key={stage.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">{stage.label}</span>
                      <span className="text-slate-400">{stage.count} kontak</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div className={`h-2.5 rounded-full ${stage.color} ${stage.width}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900">1.240</p>
                  <p className="text-xs text-slate-400">Kontak</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">97</p>
                  <p className="text-xs text-slate-400">Deal Aktif</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">32%</p>
                  <p className="text-xs text-slate-400">Konversi</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 -top-4 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/60 sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Pelanggan baru</p>
                <p className="text-xs text-slate-400">PT Maju Bersama</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

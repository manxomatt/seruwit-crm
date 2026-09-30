import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';
import { DEFAULT_SITE_NAME } from '../constants';
import HeroCommandCenter from './HeroCommandCenter';

interface Settings {
  'general.site_name'?: string;
  [key: string]: string | undefined;
}

interface HeroProps {
  settings?: Settings;
  canLogin?: boolean;
  canRegister?: boolean;
}

const Hero: React.FC<HeroProps> = ({ settings, canRegister = true }) => {
  const { t } = useTrans();
  const [rentalName, setRentalName] = useState('');

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const query: Record<string, string> = {};
    if (rentalName.trim()) {
      query.company_name = rentalName.trim();
    }
    router.visit(route('register', query));
  };

  return (
    <section className="relative isolate overflow-hidden bg-slate-50/80 pt-10 pb-20 sm:pt-14 sm:pb-28">
      {/* Precision Technical Grid Background */}
      <div 
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
      />

      {/* Subtle Ambient Top Illumination */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[64rem] rounded-full bg-gradient-to-b from-teal-400/15 via-cyan-400/10 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Command Deck Headline & Copy */}
        <div className="mx-auto max-w-4xl text-center space-y-5 mb-10">
          
          {/* Telemetry Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/90 bg-white/90 px-4 py-1.5 text-xs font-bold text-teal-900 shadow-xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            <span className="tracking-wide uppercase font-mono text-[11px]">
              {t('landing.hero.badge', undefined, 'Seruwit Rental OS • Multi-Tenant Platform')}
            </span>
          </div>

          {/* Main Editorial Headline */}
          <h1 className="font-heading text-[27px] font-black tracking-tight text-slate-950 sm:text-4xl lg:text-[45px] leading-[1.15]">
            {t('landing.hero.title_line1', undefined, 'Platform Operasi Cerdas untuk')}{' '}
            <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {t('landing.hero.title_highlight', undefined, 'Bisnis Rental Kendaraan Modern.')}
            </span>
          </h1>

          {/* Narrative Subtext */}
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {t('landing.hero.tagline_fallback', undefined, 'Maksimalkan utilisasi armada tanpa risiko. Mulai dari reservasi bebas konflik, screening dokumen penyewa, telematika GPS live, hingga pembukuan laba-rugi per mobil.')}
          </p>

          {/* Centered Command Bar: Quick Start Input */}
          {canRegister && (
            <div className="mx-auto max-w-2xl pt-2">
              <form onSubmit={handleQuickRegister}>
                <div className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/50 backdrop-blur-sm transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
                  <div className="flex flex-1 items-center px-3">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 mr-2">storefront</span>
                    <input
                      type="text"
                      value={rentalName}
                      onChange={(e) => setRentalName(e.target.value)}
                      placeholder={t('landing.hero.quick_input_placeholder', undefined, 'Ketik nama usaha rental Anda...')}
                      className="w-full border-none bg-transparent p-0 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-teal-700/20 transition hover:bg-teal-800 active:scale-95 whitespace-nowrap"
                  >
                    <span>{t('landing.hero.quick_cta', undefined, 'Mulai Coba Gratis')}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </form>

              {/* Micro Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <strong className="text-emerald-600 font-bold">✓</strong>{' '}
                  {t('landing.hero.trust_zero_conflict', undefined, 'Zero-Conflict Calendar')}
                </span>
                <span className="flex items-center gap-1.5">
                  <strong className="text-emerald-600 font-bold">✓</strong>{' '}
                  {t('landing.hero.trust_screening', undefined, 'Screening Dokumen & Anti-Fraud')}
                </span>
                <span className="flex items-center gap-1.5">
                  <strong className="text-emerald-600 font-bold">✓</strong>{' '}
                  {t('landing.hero.trust_gps', undefined, 'Integrasi External GPS')}
                </span>
                <span className="flex items-center gap-1.5">
                  <strong className="text-emerald-600 font-bold">✓</strong>{' '}
                  {t('landing.hero.trust_custom_domain', undefined, 'Custom Domain Mandiri')}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Centerpiece: Full-Width Interactive Fleet Operations Console */}
        <div className="mt-8">
          <HeroCommandCenter />
        </div>

      </div>
    </section>
  );
};

export default Hero;

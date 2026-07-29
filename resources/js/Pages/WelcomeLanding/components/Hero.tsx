import React from 'react';
import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';
import { DEFAULT_SITE_NAME } from '../constants';
import HeroVisual from './HeroVisual';

interface Settings {
  'general.site_name'?: string;
  [key: string]: string | undefined;
}

interface HeroProps {
  settings?: Settings;
  canLogin?: boolean;
  canRegister?: boolean;
}

const Hero: React.FC<HeroProps> = ({ settings, canLogin = true, canRegister = true }) => {
  const { t } = useTrans();
  const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
  // Marketing copy stays locale-aware via lang files; site_name remains from settings.
  const tagline = t('landing.hero.tagline_fallback');

  return (
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-slate-50">
      <HeroVisual />

      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="landing-reveal max-w-3xl">
          <p className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl">
            {siteName}
          </p>

          <h1 className="mt-5 max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-slate-800 sm:text-3xl lg:text-4xl">
            {t('landing.hero.title_line1')}{' '}
            <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {t('landing.hero.title_highlight')}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {tagline}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {canRegister && (
              <Link
                href={route('register')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800"
                prefetch
              >
                {t('landing.hero.cta_primary')}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            )}
            {canLogin && (
              <Link
                href={route('login')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300/80 bg-white/70 px-7 py-3.5 text-base font-semibold text-slate-800 backdrop-blur-sm transition hover:border-teal-300 hover:text-teal-800"
                prefetch
              >
                {t('landing.hero.cta_secondary')}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default Hero;

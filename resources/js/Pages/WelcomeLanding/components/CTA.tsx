import React from 'react';
import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';

interface CTAProps {
  canLogin?: boolean;
  canRegister?: boolean;
}

const CTA: React.FC<CTAProps> = ({ canLogin = true, canRegister = true }) => {
  const { t } = useTrans();

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:40px_40px]" />

          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t('landing.cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-teal-50/90">
              {t('landing.cta.subtitle')}
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              {canRegister && (
                <Link
                  href={route('register')}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50"
                  prefetch
                >
                  {t('landing.cta.primary')}
                </Link>
              )}
              {canLogin && (
                <Link
                  href={route('login')}
                  className="inline-flex items-center justify-center rounded-xl border border-white/35 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
                  prefetch
                >
                  {t('landing.cta.secondary')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

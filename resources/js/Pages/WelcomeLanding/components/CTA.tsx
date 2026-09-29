import React from 'react';
import { Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';

interface CTAProps {
  canLogin?: boolean;
  canRegister?: boolean;
}

const CTA: React.FC<CTAProps> = ({ canRegister = true }) => {
  const { t } = useTrans();

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-900 px-6 py-16 text-center sm:px-16 shadow-2xl">
          {/* Ambient Glow Orbs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t('landing.cta.title', undefined, 'Siap Mengubah Cara Mengelola Bisnis Rental Anda?')}
            </h2>
            <p className="mx-auto mt-4 text-base sm:text-lg text-teal-100/90 leading-relaxed">
              {t('landing.cta.subtitle', undefined, 'Bergabunglah dengan puluhan pemilik bisnis rental yang telah mengotomatiskan reservasi, armada, dan laporan keuangan mereka bersama Seruwit.')}
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3.5 sm:flex-row">
              {canRegister && (
                <Link
                  href={route('register')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-black text-teal-950 shadow-lg shadow-black/10 transition hover:bg-teal-50 active:scale-95"
                  prefetch
                >
                  <span>{t('landing.cta.primary', undefined, 'Mulai Coba Gratis 14 Hari')}</span>
                  <span>⚡</span>
                </Link>
              )}
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
              >
                <span>{t('landing.cta.secondary', undefined, 'Konsultasi Tim Sales')}</span>
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

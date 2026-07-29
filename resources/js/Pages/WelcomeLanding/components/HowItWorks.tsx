import React from 'react';
import { useTrans } from '@/hooks/useTrans';
import { HOW_STEP_KEYS } from '../constants';

const stepIcons = {
  register: 'person_add',
  modules: 'extension',
  operate: 'bolt',
} as const;

const HowItWorks: React.FC = () => {
  const { t } = useTrans();

  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-24" id="cara-kerja">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.08),transparent_55%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            {t('landing.how.eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t('landing.how.title')}
          </h2>
          <p className="mt-4 text-lg text-slate-500">{t('landing.how.subtitle')}</p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {HOW_STEP_KEYS.map((key, index) => (
            <li key={key} className="relative text-center md:text-left">
              {index < HOW_STEP_KEYS.length - 1 && (
                <span
                  className="pointer-events-none absolute left-[calc(50%+2.5rem)] top-6 hidden h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-teal-300 to-cyan-200 md:block"
                  aria-hidden
                />
              )}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/80 md:mx-0">
                <span className="material-symbols-outlined text-[24px]">{stepIcons[key]}</span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-teal-700/80">
                0{index + 1}
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-slate-900">
                {t(`landing.how.steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {t(`landing.how.steps.${key}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;

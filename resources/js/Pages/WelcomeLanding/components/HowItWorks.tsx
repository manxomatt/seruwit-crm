import React from 'react';
import { useTrans } from '@/hooks/useTrans';
import { HOW_STEP_KEYS } from '../constants';

const stepIcons = {
  register: 'domain_add',
  modules: 'directions_car',
  operate: 'bolt',
} as const;

const HowItWorks: React.FC = () => {
  const { t } = useTrans();

  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24" id="cara-kerja">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-teal-800">
            {t('landing.how.eyebrow', undefined, 'Setup Kilat')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {t('landing.how.title', undefined, 'Operasi Rental Siap Berjalan dalam 3 Langkah')}
          </h2>
          <p className="mt-3 text-base text-slate-500">
            {t('landing.how.subtitle', undefined, 'Setup instan tanpa instalasi server rumit. Workspace Anda siap dipakai dalam 2 menit.')}
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {HOW_STEP_KEYS.map((key, index) => (
            <li
              key={key}
              className="relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/50 p-8 shadow-xs hover:border-teal-200 hover:bg-white hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm shadow-teal-600/20">
                    <span className="material-symbols-outlined text-[24px]">{stepIcons[key]}</span>
                  </div>
                  <span className="font-display text-2xl font-black text-slate-300">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="font-display text-xl font-black text-slate-900">
                  {t(`landing.how.steps.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {t(`landing.how.steps.${key}.description`)}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-teal-700">
                Langkah 0{index + 1} Selesai ✓
              </div>
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
};

export default HowItWorks;

import React, { useMemo, useState } from 'react';
import { useTrans } from '@/hooks/useTrans';
import {
  MODULE_GROUP_KEYS,
  MODULE_ITEM_ICONS,
  MODULE_ITEM_KEYS,
  MODULE_TONE_CLASSES,
  type ModuleTone,
} from '../constants';

const Modules: React.FC = () => {
  const { t } = useTrans();
  const [activeGroup, setActiveGroup] = useState<(typeof MODULE_GROUP_KEYS)[number]>('supply');

  const groups = useMemo(
    () =>
      MODULE_GROUP_KEYS.map((key) => {
        const tone = t(`landing.modules.groups.${key}.tone`) as ModuleTone;
        const safeTone: ModuleTone = MODULE_TONE_CLASSES[tone] ? tone : 'teal';

        return {
          key,
          label: t(`landing.modules.groups.${key}.label`),
          tone: safeTone,
        };
      }),
    [t],
  );

  const items = useMemo(
    () =>
      MODULE_ITEM_KEYS.map((key) => {
        const group = t(`landing.modules.items.${key}.group`) as (typeof MODULE_GROUP_KEYS)[number];

        return {
          key,
          group,
          title: t(`landing.modules.items.${key}.title`),
          description: t(`landing.modules.items.${key}.description`),
          icon: MODULE_ITEM_ICONS[key],
        };
      }),
    [t],
  );

  const visibleItems = items.filter((item) => item.group === activeGroup);
  const activeMeta = groups.find((group) => group.key === activeGroup) ?? groups[0];
  const tone = MODULE_TONE_CLASSES[activeMeta.tone];

  return (
    <section className="bg-white py-20 sm:py-24" id="modul">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            {t('landing.modules.eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t('landing.modules.title')}
          </h2>
          <p className="mt-4 text-lg text-slate-500">{t('landing.modules.subtitle')}</p>
        </div>

        <div
          className="mt-12 flex flex-wrap justify-center gap-2"
          role="tablist"
          aria-label={t('landing.modules.eyebrow')}
        >
          {groups.map((group) => {
            const groupTone = MODULE_TONE_CLASSES[group.tone];
            const isActive = group.key === activeGroup;

            return (
              <button
                key={group.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveGroup(group.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? `${groupTone.soft} ${groupTone.text} ring-1 ring-inset ${groupTone.border}`
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${groupTone.dot}`} />
                {group.label}
              </button>
            );
          })}
        </div>

        <div
          className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
          role="tabpanel"
        >
          {visibleItems.map((item, index) => (
            <article
              key={item.key}
              className="landing-module-item group flex gap-4"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <span
                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.soft} ${tone.icon} transition group-hover:scale-105`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Modules;

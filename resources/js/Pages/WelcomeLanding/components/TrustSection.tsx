import React from 'react';
import { useTrans } from '@/hooks/useTrans';

const TrustSection: React.FC = () => {
  const { t } = useTrans();

  const pillars = [
    {
      icon: 'database',
      title: t('landing.trust_pillars.tenant_title', undefined, 'Multi-Tenant Terisolasi'),
      desc: t('landing.trust_pillars.tenant_desc', undefined, 'Keamanan data perusahaan terjamin dengan database mandiri terenkripsi dan proteksi skema terpisah.'),
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      icon: 'globe',
      title: t('landing.trust_pillars.domain_title', undefined, 'Custom Domain Mandiri'),
      desc: t('landing.trust_pillars.domain_desc', undefined, 'Gunakan domain atau subdomain usaha Anda sendiri (misal: portal.rentalanda.com) dengan SSL otomatis.'),
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      icon: 'extension',
      title: t('landing.trust_pillars.modular_title', undefined, '28+ Modul Plug-and-Play'),
      desc: t('landing.trust_pillars.modular_desc', undefined, 'Aktifkan modul logistik, bengkel gudang, atau POS kasir kapan saja bisnis Anda berkembang.'),
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      icon: 'bolt',
      title: t('landing.trust_pillars.uptime_title', undefined, '99.9% Cloud Uptime SLA'),
      desc: t('landing.trust_pillars.uptime_desc', undefined, 'Infrastruktur cloud handal, cepat, dan didukung pencadangan data otomatis berkala.'),
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <section className="border-y border-slate-200/80 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl mb-3 ${pillar.color}`}>
                <span className="material-symbols-outlined text-[22px]">{pillar.icon}</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{pillar.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;

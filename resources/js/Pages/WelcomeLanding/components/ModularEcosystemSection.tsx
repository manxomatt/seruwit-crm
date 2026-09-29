import React from 'react';
import { useTrans } from '@/hooks/useTrans';

const ModularEcosystemSection: React.FC = () => {
  const { t } = useTrans();

  const ecosystems = [
    {
      icon: 'local_shipping',
      title: t('landing.ecosystem_section.logistics_title', undefined, 'Logistik & Shuttle Travel'),
      desc: t('landing.ecosystem_section.logistics_desc', undefined, 'Manajemen pengiriman kargo, manifest rute penumpang shuttle antar-kota, loket tiket, dan penugasan armada logistik.'),
      tags: ['Manifest Rute', 'Tiket Shuttle', 'e-POD', 'Multi-Stop'],
      color: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    },
    {
      icon: 'warehouse',
      title: t('landing.ecosystem_section.inventory_title', undefined, 'Gudang & Sparepart Bengkel'),
      desc: t('landing.ecosystem_section.inventory_desc', undefined, 'Kontrol stok sparepart bengkel, stok oli, ban serep, kartu stok mutasi otomatis, dan purchasing order (PO).'),
      tags: ['Kartu Stok', 'Sparepart Bengkel', 'Nomor Seri', 'PO → GRN'],
      color: 'bg-teal-50 border-teal-200 text-teal-800',
    },
    {
      icon: 'point_of_sale',
      title: t('landing.ecosystem_section.pos_title', undefined, 'Kasir POS & Outlet Offline'),
      desc: t('landing.ecosystem_section.pos_desc', undefined, 'Kasir transaksi cabang/outlet fisik, pergantian shift kasir terintegrasi laci kas, serta katalog produk sewa.'),
      tags: ['Kasir Cabang', 'Shift Kasir', 'Struk Digital', 'Katalog Produk'],
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mx-auto max-w-3xl text-center mb-14">
          <span className="inline-block rounded-full bg-slate-200/80 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
            {t('landing.ecosystem_section.tag', undefined, 'Skalabilitas Terbuka')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {t('landing.ecosystem_section.title', undefined, 'Ekosistem Modular yang Siap Tumbuh Bersama Anda')}
          </h2>
          <p className="mt-3 text-base text-slate-500">
            {t('landing.ecosystem_section.subtitle', undefined, 'Kembangkan bisnis rental Anda ke lini terkait tanpa perlu berganti software.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ecosystems.map((eco) => (
            <div
              key={eco.title}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-md transition"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                  <span className="material-symbols-outlined text-[24px]">{eco.icon}</span>
                </span>
                <h3 className="text-base font-black text-slate-900">{eco.title}</h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {eco.desc}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {eco.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ModularEcosystemSection;

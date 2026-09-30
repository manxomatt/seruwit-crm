import React from 'react';
import { useTrans } from '@/hooks/useTrans';

const RentalOperationsSection: React.FC = () => {
  const { t } = useTrans();

  const features = [
    {
      icon: 'calendar_month',
      title: t('landing.rental_section.calendar_title', undefined, 'Zero-Conflict Booking Calendar'),
      desc: t('landing.rental_section.calendar_desc', undefined, 'Penjadwalan unit otomatis mencegah double-booking secara presisi. Lihat ketersediaan mobil per tanggal, jam, atau jenis armada seketika.'),
      badge: 'Visual Matrix',
      tone: 'teal',
    },
    {
      icon: 'photo_camera',
      title: t('landing.rental_section.handover_title', undefined, 'Inspeksi Handover Foto'),
      desc: t('landing.rental_section.handover_desc', undefined, 'Foto kondisi fisik bodi, baret/kilometer mobil sebelum & sesudah sewa via smartphone untuk menghindari dispute klaim deposit.'),
      badge: 'Anti-Dispute',
      tone: 'cyan',
    },
    {
      icon: 'badge',
      title: t('landing.rental_section.kyc_title', undefined, 'Screening Dokumen KTP/SIM & Deteksi Risiko'),
      desc: t('landing.rental_section.kyc_desc', undefined, 'Auto-OCR KTP & SIM untuk ekstraksi data instan, validasi masa aktif SIM terhadap jadwal sewa, serta pengecekan daftar blacklist penyewa secara terpadu.'),
      badge: 'Anti-Fraud',
      tone: 'emerald',
    },
    {
      icon: 'contract_edit',
      title: t('landing.rental_section.contract_title', undefined, 'Kontrak Digital Otomatis'),
      desc: t('landing.rental_section.contract_desc', undefined, 'Surat perjanjian sewa (SPK) otomatis terbit dengan pasal klausul rental lengkap dan tanda tangan digital saat booking disetujui.'),
      badge: 'Paperless',
      tone: 'indigo',
    },
  ];

  return (
    <section id="rental" className="py-20 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            {t('landing.rental_section.title', undefined, 'Operasi Rental Kendaraan Bebas Konflik & Terotomatisasi')}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {t('landing.rental_section.subtitle', undefined, 'Mulai dari sewa mobil lepas kunci, paket mobil dengan driver, hingga shuttle antar-kota—seluruh alur booking tersaji rapi dalam satu layar.')}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item) => (
            <div
              key={item.title}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-slate-50/50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-xl hover:shadow-teal-900/5"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition">
                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-800 transition">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-800 transition">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-teal-700">
                <span>Pelajari fitur</span>
                <span className="material-symbols-outlined text-[16px] ml-1 transition group-hover:translate-x-1">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default RentalOperationsSection;

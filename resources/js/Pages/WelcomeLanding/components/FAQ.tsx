import React, { useState } from 'react';
import { useTrans } from '@/hooks/useTrans';

const FAQ: React.FC = () => {
  const { t } = useTrans();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: t('landing.faq.q1', undefined, 'Apakah Seruwit cocok untuk usaha rental skala kecil (di bawah 10 armada)?'),
      a: t('landing.faq.a1', undefined, 'Sangat cocok. Seruwit dirancang fleksibel mulai dari pemilik rental 5 unit mobil hingga ratusan armada tanpa biaya lisensi awal yang mahal.'),
    },
    {
      q: t('landing.faq.q2', undefined, 'Bagaimana cara screening dan verifikasi dokumen penyewa bekerja?'),
      a: t('landing.faq.a2', undefined, 'Sistem membaca foto KTP dan SIM secara otomatis menggunakan Auto-OCR untuk mengekstrak NIK, nama, dan masa berlaku tanpa perlu input manual. Sistem memvalidasi apakah SIM masih aktif selama masa sewa, mencocokkan nama dengan pemesan, serta mengecek catatan blacklist sebelum kendaraan diserahterimakan.'),
    },
    {
      q: t('landing.faq.q3', undefined, 'Apakah laporan laba rugi benar-benar bisa dilihat per masing-masing mobil?'),
      a: t('landing.faq.a3', undefined, 'Betul. Setiap pengeluaran (BBM, servis, ganti ban, oli) dan pendapatan sewa di-tag ke plat nomor kendaraan bersangkutan sehingga laporan Laba Rugi Unit (P&L per Vehicle) otomatis terbentuk.'),
    },
    {
      q: t('landing.faq.q4', undefined, 'Apakah saya bisa menggunakan domain saya sendiri (misal: portal.rentaljayabersama.com)?'),
      a: t('landing.faq.a4', undefined, 'Bisa. Seruwit mendukung fitur Custom Domain dengan sertifikat SSL gratis otomatis yang siap dihubungkan langsung dari menu pengaturan domain Anda.'),
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-24 bg-slate-50 border-t border-slate-200/80">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-slate-200/80 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
            {t('landing.faq.tag', undefined, 'Tanya Jawab')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {t('landing.faq.title', undefined, 'Pertanyaan Seputar Seruwit Rental OS')}
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition shadow-xs hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-teal-700 transition"
                >
                  <span className="text-sm sm:text-base pr-4">{faq.q}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 text-sm font-bold">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 p-5 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FAQ;

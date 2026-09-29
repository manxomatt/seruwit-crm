import React from 'react';
import { useTrans } from '@/hooks/useTrans';

const RentalAccountingSection: React.FC = () => {
  const { t } = useTrans();

  const accountingPillars = [
    {
      icon: 'receipt_long',
      title: t('landing.accounting_section.invoice_title', undefined, 'Faktur & Payment Gateway Otomatis'),
      desc: t('landing.accounting_section.invoice_desc', undefined, 'Terbitkan invoice digital PDF otomatis begitu booking terkonfirmasi. Penyewa bisa langsung membayar via QRIS, Virtual Account bank, atau Kartu Kredit.'),
      checks: [
        'Status lunas otomatis (auto-reconcile) tanpa cek mutasi manual',
        'Kirim link pembayaran instan via WhatsApp / Email',
      ],
      toneBg: 'bg-teal-50 border-teal-100',
      iconBg: 'bg-teal-600',
    },
    {
      icon: 'shield_lock',
      title: t('landing.accounting_section.deposit_title', undefined, 'Deposit & Jaminan Sewa Terkendali'),
      desc: t('landing.accounting_section.deposit_desc', undefined, 'Kelola uang jaminan (deposit sewa) secara transparan. Tahan deposit secara digital, potong otomatis jika ada denda overtime/baret, dan kembalikan sisa deposit seketika.'),
      checks: [
        'Pencatatan mutasi saldo deposit terpisah dari omset rental',
        'Bukti potong klaim kerusakan terlampir transparan',
      ],
      toneBg: 'bg-cyan-50 border-cyan-100',
      iconBg: 'bg-cyan-600',
    },
    {
      icon: 'monitoring',
      title: t('landing.accounting_section.pnl_title', undefined, 'Laba Rugi per Unit Mobil (P&L per Vehicle)'),
      desc: t('landing.accounting_section.pnl_desc', undefined, 'Ketahui mobil mana yang paling menguntungkan. Bandingkan pendapatan sewa mobil vs total biaya BBM, tol, servis bengkel, dan komisi sopir.'),
      checks: [
        'Profit margin bersih dihitung per masing-masing nomor plat',
        'Buku Besar (GL) & Neraca otomatis terbentuk di background',
      ],
      toneBg: 'bg-indigo-50 border-indigo-100',
      iconBg: 'bg-indigo-600',
    },
  ];

  return (
    <section id="akuntansi" className="py-20 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-800 border border-emerald-200 mb-3">
            {t('landing.accounting_section.tag', undefined, 'Pilar Flagship 03')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            {t('landing.accounting_section.title', undefined, 'Akuntansi & Finansial Lengkap Khusus Bisnis Rental')}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {t('landing.accounting_section.subtitle', undefined, 'Bukan akuntansi generik. Seruwit dirancang khusus untuk memahami siklus keuangan rental: deposit jaminan, biaya operasional per armada, piutang korporat, hingga faktur instan.')}
          </p>
        </div>

        {/* 3 Pillars Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {accountingPillars.map((item) => (
            <div
              key={item.title}
              className={`flex flex-col justify-between rounded-3xl border p-8 shadow-sm transition hover:shadow-xl hover:-translate-y-1 ${item.toneBg}`}
            >
              <div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md mb-6 ${item.iconBg}`}>
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200/60 space-y-2.5">
                {item.checks.map((check) => (
                  <div key={check} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                    <span className="text-teal-700 font-black">✓</span>
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default RentalAccountingSection;

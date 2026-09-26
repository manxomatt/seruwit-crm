<?php

namespace Modules\Pages\Support;

class CentralLandingPageTemplate
{
    /**
     * Build the data array for the modern Seruwit Central Landing Page.
     *
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: null}
     */
    public static function build(): array
    {
        $css = self::css();
        $html = self::html();

        return [
            'title' => 'Seruwit Biz – Platform SaaS Rental Kendaraan & Ekosistem Bisnis Modular',
            'slug' => 'home',
            'html' => '<style>'.$css.'</style>'."\n".$html,
            'css' => $css,
            'gjs_data' => null,
        ];
    }

    public static function css(): string
    {
        return <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

body, .srw-root {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
}

.glass-capsule {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
}

.mesh-gradient {
  background: radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.12) 0px, transparent 50%),
              radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(248, 250, 252, 0.8) 0px, transparent 100%);
}
CSS;
    }

    public static function html(): string
    {
        return <<<'HTML'
<div class="srw-root bg-slate-50 text-slate-800 antialiased selection:bg-teal-500 selection:text-white">

  <!-- TOP CAPSULE FLOATING HEADER -->
  <header class="fixed top-4 inset-x-0 z-50 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto glass-capsule rounded-full px-5 py-3 flex items-center justify-between transition-all">
      <!-- Logo & Brand -->
      <a href="/" class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/30">
          <span class="material-symbols-outlined text-[20px]">directions_car</span>
        </span>
        <span class="font-extrabold text-slate-900 text-lg tracking-tight">{{setting:general.site_name}}</span>
        <span class="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full">SaaS Rental</span>
      </a>

      <!-- Navigation Links -->
      <nav class="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
        <a href="#armada" class="hover:text-teal-700 transition">Fleet Management</a>
        <a href="#operasional" class="hover:text-teal-700 transition">Rental Operations</a>
        <a href="#keuangan" class="hover:text-teal-700 transition">Finance &amp; ROI</a>
        <a href="#modular" class="hover:text-teal-700 transition">Modular Ecosystem</a>
        <a href="#harga" class="hover:text-teal-700 transition">Harga</a>
        <a href="#faq" class="hover:text-teal-700 transition">FAQ</a>
      </nav>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <a href="/login" class="hidden sm:inline-block text-xs font-bold text-slate-700 hover:text-teal-700 px-3 py-2 transition">Masuk</a>
        <a href="/register" class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-700 to-teal-600 px-4 sm:px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-700/25 hover:from-teal-800 hover:to-teal-700 transition transform hover:-translate-y-0.5">
          <span>Mulai Gratis</span>
          <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden mesh-gradient">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 text-center">
      <!-- Badge Pill -->
      <div class="inline-flex items-center gap-2 rounded-full bg-white/80 border border-teal-200/70 px-4 py-1.5 shadow-sm mb-6">
        <span class="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
        <span class="text-xs font-bold text-teal-800 tracking-wide">Platform All-in-One Manajemen Rental Modern</span>
      </div>

      <!-- Main Headline -->
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
        Kendalikan Armada, Bisnis Rental &amp; Keuangan dalam <span class="bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">Satu Platform Cerdas</span>
      </h1>

      <!-- Subheadline -->
      <p class="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Solusi SaaS komprehensif bagi pemilik rental kendaraan. Otomatisasi ketersediaan armada, pencatatan sewa digital, perawatan berkala, dan pembukuan laba-rugi otomatis tanpa ribet.
      </p>

      <!-- Dual CTA Buttons -->
      <div class="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/register" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-teal-700/30 hover:opacity-95 transition transform hover:-translate-y-0.5">
          <span>Coba Gratis 14 Hari</span>
          <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
        </a>
        <a href="#fitur" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/90 px-7 py-4 text-sm font-bold text-slate-700 hover:border-teal-400 hover:text-teal-800 transition shadow-sm">
          <span class="material-symbols-outlined text-[18px] text-teal-600">play_circle</span>
          <span>Lihat Demo Interaktif</span>
        </a>
      </div>

      <!-- Hero Dashboard Visual Preview -->
      <div class="mt-14 relative mx-auto max-w-5xl rounded-3xl p-3 bg-gradient-to-b from-teal-500/20 via-cyan-500/10 to-transparent shadow-2xl">
        <div class="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-inner text-left">
          <!-- Top bar mockup -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full bg-rose-400"></span>
              <span class="w-3 h-3 rounded-full bg-amber-400"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span class="ml-2 text-xs font-mono text-slate-400">app.seruwit.com/fleet-overview</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold border border-emerald-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Fleet Monitor
              </span>
            </div>
          </div>

          <!-- 3 Grid Widget Mockup -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Widget 1: Fleet -->
            <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Armada</span>
                <span class="material-symbols-outlined text-teal-600 text-[20px]">directions_car</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-slate-900">42</span>
                <span class="text-xs font-semibold text-emerald-600">36 Unit Aktif Disewa</span>
              </div>
              <div class="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div class="bg-emerald-500 h-full w-[85%]"></div>
                <div class="bg-amber-400 h-full w-[10%]"></div>
                <div class="bg-slate-400 h-full w-[5%]"></div>
              </div>
              <div class="mt-2 flex justify-between text-[11px] text-slate-500 font-medium">
                <span>85% Tersewa</span>
                <span>Servis: 2 Unit</span>
              </div>
            </div>

            <!-- Widget 2: Booking Calendar -->
            <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Reservasi Hari Ini</span>
                <span class="material-symbols-outlined text-cyan-600 text-[20px]">event_available</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-slate-900">18 Order</span>
                <span class="text-xs font-semibold text-cyan-600">+4 Menunggu Check-in</span>
              </div>
              <div class="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                <span class="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                <span class="truncate">Innova Zenix - B 1294 ABC (Handover OK)</span>
              </div>
            </div>

            <!-- Widget 3: Cashflow -->
            <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Omset Bulan Ini</span>
                <span class="material-symbols-outlined text-emerald-600 text-[20px]">payments</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-slate-900">Rp 128.5 Jt</span>
                <span class="text-xs font-bold text-emerald-600">↑ 18.4%</span>
              </div>
              <div class="mt-3 flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Bagi Hasil Mitra: Rp 38 Jt</span>
                <span class="font-bold text-slate-700">Net: Rp 90.5 Jt</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- TRUST BAR -->
  <section class="py-12 border-y border-slate-200/80 bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <p class="text-3xl font-extrabold text-slate-900">99.9%</p>
          <p class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Akurasi Jadwal Armada</p>
        </div>
        <div>
          <p class="text-3xl font-extrabold text-teal-700">3x Lipat</p>
          <p class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Kecepatan Handover Unit</p>
        </div>
        <div>
          <p class="text-3xl font-extrabold text-cyan-700">100%</p>
          <p class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Transparansi Finansial</p>
        </div>
        <div>
          <p class="text-3xl font-extrabold text-slate-900">Modular</p>
          <p class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Skalabel Tanpa Batas</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 3 CORE PILLARS SECTION -->
  <section class="py-24 bg-slate-50" id="fitur">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <span class="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">3 Pilar Solusi Utama</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">Dibuat Khusus untuk Tantangan Nyata Pemilik Rental</h2>
        <p class="text-slate-600 mt-3 text-sm sm:text-base">Mulai dari ketersediaan fisik mobil hingga pembagian hasil investor, semua terkendali rapi.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Pilar 1: Fleet Management -->
        <div id="armada" class="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-6">
              <span class="material-symbols-outlined text-[28px]">directions_car</span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">Fleet Management</h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-6">
              Pantau kondisi dan utilisasi seluruh armada secara real-time. Cegah kerugian akibat kerusakan tersembunyi dan unit terbengkalai.
            </p>
            <ul class="space-y-3 text-xs font-medium text-slate-700 border-t border-slate-100 pt-6">
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-teal-600 text-[18px]">check_circle</span>
                <span>Monitoring status ketersediaan live</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-teal-600 text-[18px]">check_circle</span>
                <span>Jadwal servis preventif &amp; pengingat STNK</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-teal-600 text-[18px]">check_circle</span>
                <span>Inspeksi fisik unit &amp; dokumentasi foto</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-teal-600 text-[18px]">check_circle</span>
                <span>Riwayat pemeliharaan &amp; biaya per unit</span>
              </li>
            </ul>
          </div>
          <div class="mt-8 pt-6 border-t border-slate-100">
            <a href="/register" class="text-xs font-bold text-teal-700 inline-flex items-center gap-1">Eksplorasi Armada →</a>
          </div>
        </div>

        <!-- Pilar 2: Rental Operations -->
        <div id="operasional" class="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ring-2 ring-teal-600/20">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 mb-6">
              <span class="material-symbols-outlined text-[28px]">calendar_month</span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">Rental Operations</h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-6">
              Kelola alur pemesanan tanpa risiko bentrok jadwal. Dari booking pelanggan hingga serah terima unit secara digital.
            </p>
            <ul class="space-y-3 text-xs font-medium text-slate-700 border-t border-slate-100 pt-6">
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-cyan-600 text-[18px]">check_circle</span>
                <span>Kalender booking visual anti bentrok</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-cyan-600 text-[18px]">check_circle</span>
                <span>Surat kontrak sewa digital &amp; e-signature</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-cyan-600 text-[18px]">check_circle</span>
                <span>Verifikasi ID &amp; manajemen deposit jaminan</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-cyan-600 text-[18px]">check_circle</span>
                <span>Multi-cabang &amp; opsi antar-jemput unit</span>
              </li>
            </ul>
          </div>
          <div class="mt-8 pt-6 border-t border-slate-100">
            <a href="/register" class="text-xs font-bold text-cyan-700 inline-flex items-center gap-1">Eksplorasi Operasional →</a>
          </div>
        </div>

        <!-- Pilar 3: Finance Management -->
        <div id="keuangan" class="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-6">
              <span class="material-symbols-outlined text-[28px]">account_balance_wallet</span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">Finance &amp; ROI</h3>
            <p class="text-sm text-slate-600 leading-relaxed mb-6">
              Otomatisasi pembukuan dan analisis laba-rugi setiap armada. Transparan bagi pengelola dan pemilik unit titipan.
            </p>
            <ul class="space-y-3 text-xs font-medium text-slate-700 border-t border-slate-100 pt-6">
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                <span>Invoice digital instan ber-QR payment</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                <span>Otomatisasi split revenue mitra / investor</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                <span>Laporan profit &amp; margin bersih per armada</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                <span>Pencatatan kas operasional harian terpadu</span>
              </li>
            </ul>
          </div>
          <div class="mt-8 pt-6 border-t border-slate-100">
            <a href="/register" class="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">Eksplorasi Keuangan →</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- MODULAR ECOSYSTEM SECTION -->
  <section class="py-20 bg-white border-t border-slate-200/80" id="modular">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 sm:p-14 text-white relative overflow-hidden">
        <div class="relative z-10 max-w-2xl">
          <span class="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800/80 px-3 py-1 rounded-full">Arsitektur Modular Seruwit</span>
          <h2 class="text-3xl sm:text-4xl font-extrabold mt-4 tracking-tight">Platform yang Tumbuh Bersama Skala Bisnis Anda</h2>
          <p class="text-slate-300 mt-4 text-sm sm:text-base leading-relaxed">
            Tidak ada fitur berlebih yang memperlambat sistem. Aktifkan modul tambahan sesuai kebutuhan operasional armada dan cabang Anda sewaktu-waktu.
          </p>

          <div class="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="rounded-xl bg-white/10 border border-white/10 p-3.5 backdrop-blur-sm">
              <span class="material-symbols-outlined text-teal-400 text-[20px] mb-1">web</span>
              <p class="text-xs font-bold">Storefront &amp; Pages</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Katalog rental visual</p>
            </div>
            <div class="rounded-xl bg-white/10 border border-white/10 p-3.5 backdrop-blur-sm">
              <span class="material-symbols-outlined text-cyan-400 text-[20px] mb-1">chat</span>
              <p class="text-xs font-bold">WhatsApp Reminder</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Notifikasi otomatis</p>
            </div>
            <div class="rounded-xl bg-white/10 border border-white/10 p-3.5 backdrop-blur-sm">
              <span class="material-symbols-outlined text-emerald-400 text-[20px] mb-1">domain</span>
              <p class="text-xs font-bold">Multi-Tenant Cabang</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Multi-lokasi rental</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRICING SECTION -->
  <section class="py-20 bg-slate-50 border-t border-slate-200/80" id="harga">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <span class="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">Paket Investasi Bisnis</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">Pilihan Paket Fleksibel Sesuai Jumlah Armada</h2>
        <p class="text-slate-600 mt-3 text-sm sm:text-base">Mulai gratis 14 hari. Tanpa komitmen kartu kredit. Upgrade kapan saja saat armada bertambah.</p>
      </div>

      {{pricing_table}}
    </div>
  </section>

  <!-- FAQ SECTION -->
  <section class="py-20 bg-white border-t border-slate-200/80" id="faq">
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <span class="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">Tanya Jawab</span>
        <h2 class="text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
        <p class="text-slate-600 mt-3 text-sm">Semua yang perlu Anda ketahui sebelum menggunakan platform Seruwit SaaS.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 class="text-base font-bold text-slate-900 mb-2">Apakah aplikasi ini cocok untuk rental mobil dan motor?</h3>
          <p class="text-sm text-slate-600 leading-relaxed">Ya. Seruwit dirancang fleksibel untuk segala jenis rental kendaraan, baik mobil keluarga, mobil premium, bus/shuttle, hingga motor harian.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 class="text-base font-bold text-slate-900 mb-2">Bagaimana jika saya memiliki armada milik investor (titip sewa)?</h3>
          <p class="text-sm text-slate-600 leading-relaxed">Sistem menyediakan fitur split revenue otomatis. Anda dapat menentukan persentase bagi hasil dan menghasilkan laporan bulanan transparan bagi mitra.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 class="text-base font-bold text-slate-900 mb-2">Apakah saya bisa memindahkan data dari Excel?</h3>
          <p class="text-sm text-slate-600 leading-relaxed">Tentu saja. Tersedia fitur impor data kendaraan dan pelanggan via file spreadsheet sehingga Anda tidak perlu input satu per satu secara manual.</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 class="text-base font-bold text-slate-900 mb-2">Apakah halaman website publik bisa diedit sendiri?</h3>
          <p class="text-sm text-slate-600 leading-relaxed">Bisa! Seruwit dilengkapi modul visual Page Builder (GrapesJS) yang memungkinkan Anda mengubah teks, gambar, promo, dan katalog tanpa koding.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CAPSULE CTA SECTION -->
  <section class="py-24 bg-slate-50" id="daftar">
    <div class="max-w-5xl mx-auto px-4 sm:px-6">
      <div class="rounded-[2.5rem] bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden">
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Siap Modernisasi Bisnis Rental Anda?</h2>
        <p class="mt-4 text-teal-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Tingkatkan efisiensi armada dan pantau laba secara akurat hari ini. Mulai uji coba gratis 14 hari tanpa biaya komitmen.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/register" class="rounded-full bg-white px-8 py-4 text-sm font-extrabold text-teal-800 shadow-lg hover:bg-slate-50 transition transform hover:-translate-y-0.5">
            Mulai Uji Coba Gratis 14 Hari
          </a>
          <a href="/login" class="rounded-full border border-teal-300/60 bg-teal-900/30 px-7 py-4 text-sm font-bold text-white hover:bg-teal-900/50 transition">
            Masuk ke Portal Akun
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div class="md:col-span-1">
          <div class="flex items-center gap-2 text-white font-extrabold text-lg mb-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
              <span class="material-symbols-outlined text-[16px]">directions_car</span>
            </span>
            <span>{{setting:general.site_name}}</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Platform SaaS all-in-one untuk efisiensi armada, operasional reservasi, dan keuangan bisnis rental.
          </p>
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Fitur Inti</h4>
          <ul class="space-y-2 text-xs">
            <li><a href="#armada" class="hover:text-white transition">Fleet Management</a></li>
            <li><a href="#operasional" class="hover:text-white transition">Rental Operations</a></li>
            <li><a href="#keuangan" class="hover:text-white transition">Finance &amp; ROI</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Ekosistem</h4>
          <ul class="space-y-2 text-xs">
            <li><a href="#modular" class="hover:text-white transition">Modul Storefront</a></li>
            <li><a href="#modular" class="hover:text-white transition">Modul GrapesJS Pages</a></li>
            <li><a href="#modular" class="hover:text-white transition">Integrasi Multi-cabang</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Akses</h4>
          <ul class="space-y-2 text-xs">
            <li><a href="/login" class="hover:text-white transition">Login Akun</a></li>
            <li><a href="/register" class="hover:text-white transition">Registrasi Tenant Baru</a></li>
            <li><a href="#faq" class="hover:text-white transition">Syarat &amp; Ketentuan</a></li>
          </ul>
        </div>
      </div>
      <div class="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        {{setting:site.copyright}}
      </div>
    </div>
  </footer>

</div>
HTML;
    }
}

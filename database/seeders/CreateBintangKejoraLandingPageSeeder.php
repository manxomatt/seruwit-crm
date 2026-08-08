<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Pages\Models\Page;

class CreateBintangKejoraLandingPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * GrapesJS compatibility notes:
     * - gjs_data must be NULL so the editor falls back to setComponents(html) + setStyle(css)
     * - @import rules are not handled by GrapesJS setStyle(), so all CSS (including @import)
     *   is embedded inside a <style> tag within the HTML fragment.
     * - The css field is left empty so GrapesJS does not call setStyle() at all.
     * - render.blade.php injects $page->css into <head>, so the live page still looks correct
     *   because the <style> tag inside the HTML body is also valid there.
     */
    public function run(): void
    {
        // Ensure the pages table exists (important for tenant databases)
        if (! Schema::hasTable('pages')) {
            return;
        }

        // Use first available user as the page owner
        $userId = User::query()->value('id') ?? 1;

        // All CSS is embedded inside <style> in the HTML so GrapesJS can render it correctly.
        // The css field is intentionally empty.
        $html = <<<'HTML'
<div class="bkr-wrap">
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

/* Override template flex injection */
.bkr-wrap, .bkr-wrap > * {
    display: block !important;
    flex-direction: unset !important;
    flex-grow: unset !important;
    flex-shrink: unset !important;
    min-width: unset !important;
}
.bkr-wrap *, .bkr-wrap *::before, .bkr-wrap *::after { box-sizing: border-box; }
.bkr-wrap {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a2332;
    background: #f4f8fb;
    line-height: 1.6;
    width: 100%;
}
.bkr-wrap h1,.bkr-wrap h2,.bkr-wrap h3,.bkr-wrap h4 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin: 0; padding: 0;
}
.bkr-wrap p { margin: 0; padding: 0; }
.bkr-wrap a { text-decoration: none; }
.bkr-wrap ul { list-style: none; margin: 0; padding: 0; }

/* Container */
.bkr-container {
    width: 100%;
    max-width: 1140px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 24px;
    padding-right: 24px;
}

/* NAVBAR */
.bkr-nav {
    display: flex !important;
    align-items: center;
    position: sticky;
    top: 0; z-index: 200;
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #dce8f0;
    height: 66px; width: 100%;
}
.bkr-nav-inner {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    width: 100%; max-width: 1140px;
    margin: 0 auto; padding: 0 24px;
}
.bkr-brand { font-size: 1.3rem; font-weight: 800; color: #1e6fa8; display: flex !important; align-items: center; gap: 6px; }
.bkr-brand-star { color: #f59e0b; }
.bkr-nav-links { display: flex !important; gap: 28px; align-items: center; }
.bkr-nav-links a { font-size: .88rem; font-weight: 500; color: #5a7184; transition: color .2s; }
.bkr-nav-links a:hover { color: #1e6fa8; }
.bkr-btn-nav {
    background: #1e6fa8; color: #fff !important;
    padding: 9px 22px; border-radius: 50px;
    font-size: .86rem; font-weight: 700;
    transition: background .2s, transform .15s; white-space: nowrap;
}
.bkr-btn-nav:hover { background: #2d90d6; transform: translateY(-1px); }

/* HERO */
.bkr-hero {
    background: linear-gradient(135deg, #e8f4fd 0%, #f4f8fb 55%, #fef9ec 100%);
    padding: 80px 0; width: 100%; overflow: hidden; position: relative;
}
.bkr-hero::before {
    content: ''; position: absolute; top: -100px; right: -80px;
    width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(30,111,168,.07) 0%, transparent 70%);
    pointer-events: none;
}
.bkr-hero-inner { display: flex !important; align-items: center; gap: 48px; }
.bkr-hero-content { flex: 1; min-width: 0; }
.bkr-hero-image { flex: 0 0 400px; }
.bkr-badge {
    display: inline-flex !important; align-items: center; gap: 8px;
    background: rgba(30,111,168,.09); color: #1e6fa8;
    padding: 6px 16px; border-radius: 50px;
    font-size: .74rem; font-weight: 700; letter-spacing: .5px;
    text-transform: uppercase; margin-bottom: 20px;
}
.bkr-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; display: inline-block !important; }
.bkr-hero-title { font-size: clamp(1.9rem, 3.8vw, 3rem); font-weight: 800; color: #1a2332; line-height: 1.15; margin-bottom: 18px; }
.bkr-hero-title span { color: #1e6fa8; }
.bkr-hero-desc { font-size: 1rem; color: #5a7184; margin-bottom: 32px; max-width: 460px; }
.bkr-hero-actions { display: flex !important; gap: 14px; flex-wrap: wrap; margin-bottom: 44px; }
.bkr-btn-primary {
    background: #1e6fa8; color: #fff !important;
    padding: 13px 28px; border-radius: 50px; font-size: .95rem; font-weight: 700;
    display: inline-flex !important; align-items: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(30,111,168,.28); transition: background .2s, transform .15s;
}
.bkr-btn-primary:hover { background: #2d90d6; transform: translateY(-2px); }
.bkr-btn-outline {
    background: transparent; color: #1e6fa8 !important;
    padding: 13px 28px; border-radius: 50px; font-size: .95rem; font-weight: 600;
    border: 2px solid #1e6fa8; transition: background .2s, color .2s;
}
.bkr-btn-outline:hover { background: #1e6fa8; color: #fff !important; }
.bkr-hero-stats { display: flex !important; gap: 32px; flex-wrap: wrap; }
.bkr-stat-num { font-size: 1.7rem; font-weight: 800; color: #1e6fa8; }
.bkr-stat-lbl { font-size: .76rem; color: #5a7184; font-weight: 500; }

.bkr-car-card {
    background: #fff; border-radius: 22px; padding: 26px;
    box-shadow: 0 20px 60px rgba(30,111,168,.18); position: relative; width: 100%;
}
.bkr-car-pill {
    position: absolute; top: 16px; left: 16px;
    background: #f59e0b; color: #fff;
    font-size: .7rem; font-weight: 700; padding: 3px 12px; border-radius: 50px;
}
.bkr-car-thumb {
    background: linear-gradient(135deg, #e8f4fd, #dce8f0);
    border-radius: 14px; padding: 22px; font-size: 4.5rem; text-align: center; line-height: 1;
}
.bkr-car-name { font-size: 1.05rem; font-weight: 700; margin: 14px 0 4px; color: #1a2332; }
.bkr-car-sub { font-size: .78rem; color: #5a7184; }
.bkr-car-footer {
    display: flex !important; align-items: center; justify-content: space-between;
    margin-top: 14px; padding-top: 12px; border-top: 1px solid #dce8f0;
}
.bkr-car-price { font-size: 1.1rem; font-weight: 800; color: #1e6fa8; }
.bkr-car-price small { font-size: .72rem; font-weight: 500; color: #5a7184; }
.bkr-btn-book { background: #1e6fa8; color: #fff !important; padding: 8px 18px; border-radius: 8px; font-size: .8rem; font-weight: 700; transition: background .2s; }
.bkr-btn-book:hover { background: #2d90d6; }

/* SEARCH */
.bkr-search-section { background: #f4f8fb; padding: 0 0 20px; width: 100%; }
.bkr-search-box {
    background: #fff; border-radius: 14px;
    box-shadow: 0 8px 32px rgba(30,111,168,.14); border: 1px solid #dce8f0;
    padding: 22px 26px; display: flex !important; gap: 14px; align-items: flex-end; flex-wrap: wrap;
    margin-top: -36px; position: relative; z-index: 10;
}
.bkr-field { flex: 1 1 140px; min-width: 0; }
.bkr-field label { display: block; font-size: .7rem; font-weight: 700; color: #5a7184; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.bkr-field input, .bkr-field select {
    width: 100%; padding: 9px 12px; border: 1.5px solid #dce8f0; border-radius: 9px;
    font-size: .88rem; font-family: inherit; color: #1a2332; background: #f4f8fb; outline: none; transition: border-color .2s; appearance: auto;
}
.bkr-field input:focus, .bkr-field select:focus { border-color: #1e6fa8; }
.bkr-btn-search {
    background: #1e6fa8; color: #fff; padding: 10px 24px; border-radius: 9px;
    font-size: .9rem; font-weight: 700; border: none; cursor: pointer;
    font-family: inherit; white-space: nowrap; flex-shrink: 0; transition: background .2s;
}
.bkr-btn-search:hover { background: #2d90d6; }

/* SECTIONS */
.bkr-section { padding: 72px 0; width: 100%; }
.bkr-section-bg { background: #f4f8fb; }
.bkr-section-white { background: #ffffff; }
.bkr-section-blue { background: linear-gradient(135deg, #e8f4fd 0%, #f4f8fb 100%); }
.bkr-sec-head { text-align: center; margin-bottom: 52px; }
.bkr-sec-label { font-size: .72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #1e6fa8; margin-bottom: 10px; }
.bkr-sec-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #1a2332; }
.bkr-sec-sub {
    color: #5a7184; margin-top: 10px; font-size: .93rem; max-width: 500px;
    margin-left: auto !important; margin-right: auto !important;
    text-align: center !important; display: block !important;
}

/* SERVICE CARDS */
.bkr-svc-grid { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 22px; }
.bkr-svc-card {
    background: #fff; border-radius: 14px; padding: 28px 22px;
    box-shadow: 0 2px 12px rgba(30,111,168,.08); border: 1px solid #dce8f0;
    text-align: center; transition: transform .25s, box-shadow .25s;
}
.bkr-svc-card:hover { transform: translateY(-6px); box-shadow: 0 8px 32px rgba(30,111,168,.14); }
.bkr-svc-icon {
    width: 56px; height: 56px; border-radius: 14px;
    background: linear-gradient(135deg, #1e6fa8, #2d90d6);
    display: inline-flex !important; align-items: center; justify-content: center;
    font-size: 1.5rem; margin-bottom: 16px;
}
.bkr-svc-card h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #1a2332; }
.bkr-svc-card p { font-size: .83rem; color: #5a7184; }

/* FLEET */
.bkr-fleet-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.bkr-fleet-card {
    background: #f4f8fb; border-radius: 14px; overflow: hidden;
    border: 1px solid #dce8f0; transition: transform .25s, box-shadow .25s;
}
.bkr-fleet-card:hover { transform: translateY(-6px); box-shadow: 0 8px 32px rgba(30,111,168,.14); }
.bkr-fleet-thumb {
    background: linear-gradient(135deg, #e8f4fd, #dce8f0);
    padding: 22px 16px 14px; font-size: 3.5rem; text-align: center; line-height: 1;
    height: 110px; display: flex !important; align-items: center; justify-content: center;
}
.bkr-fleet-body { padding: 16px 18px 18px; }
.bkr-fleet-cat { font-size: .66rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #1e6fa8; margin-bottom: 5px; }
.bkr-fleet-body h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #1a2332; }
.bkr-fleet-specs { display: flex !important; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.bkr-spec { font-size: .71rem; color: #5a7184; display: flex !important; align-items: center; gap: 3px; }
.bkr-fleet-foot { display: flex !important; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #dce8f0; }
.bkr-price { font-weight: 800; color: #1e6fa8; font-size: .93rem; }
.bkr-price small { font-size: .7rem; font-weight: 500; color: #5a7184; }

/* HOW */
.bkr-steps { display: flex !important; gap: 0; position: relative; justify-content: center; }
.bkr-steps::before { content: ''; position: absolute; top: 33px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg, #1e6fa8, #2d90d6); }
.bkr-step { flex: 1; text-align: center; position: relative; z-index: 1; padding: 0 16px; }
.bkr-step-num {
    width: 66px; height: 66px; border-radius: 50%;
    background: #1e6fa8; color: #fff;
    display: inline-flex !important; align-items: center; justify-content: center;
    font-size: 1.4rem; font-weight: 800; margin-bottom: 14px;
    box-shadow: 0 6px 20px rgba(30,111,168,.26); border: 4px solid #f4f8fb;
}
.bkr-step h4 { font-size: .9rem; font-weight: 700; margin-bottom: 6px; color: #1a2332; }
.bkr-step p { font-size: .78rem; color: #5a7184; }

/* TESTIMONIALS */
.bkr-testi-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.bkr-testi-card { background: #f4f8fb; border-radius: 14px; padding: 24px 22px; border: 1px solid #dce8f0; }
.bkr-stars { color: #f59e0b; font-size: 1rem; margin-bottom: 12px; }
.bkr-testi-text { font-size: .86rem; color: #5a7184; margin-bottom: 18px; font-style: italic; }
.bkr-testi-user { display: flex !important; align-items: center; gap: 10px; }
.bkr-avatar {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #1e6fa8, #2d90d6);
    display: inline-flex !important; align-items: center; justify-content: center;
    font-size: .86rem; color: #fff; font-weight: 700;
}
.bkr-testi-name { font-weight: 700; font-size: .86rem; color: #1a2332; }
.bkr-testi-role { font-size: .74rem; color: #5a7184; }

/* CTA */
.bkr-cta { background: linear-gradient(135deg, #1e6fa8 0%, #2d90d6 100%); padding: 72px 0; text-align: center; width: 100%; }
.bkr-cta h2 { font-size: clamp(1.6rem, 3.5vw, 2.5rem); color: #fff; margin-bottom: 12px; font-weight: 800; }
.bkr-cta p { font-size: .95rem; color: rgba(255,255,255,.85); max-width: 440px; margin: 0 auto 30px; }
.bkr-btn-cta {
    background: #fff; color: #1e6fa8 !important; padding: 13px 34px; border-radius: 50px;
    font-size: .95rem; font-weight: 700; box-shadow: 0 8px 24px rgba(0,0,0,.14);
    display: inline-block !important; transition: transform .2s, box-shadow .2s;
}
.bkr-btn-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,.20); }

/* FOOTER */
.bkr-footer { background: #0f1e2d; padding: 56px 0 28px; width: 100%; }
.bkr-footer-grid { display: grid !important; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 36px; margin-bottom: 40px; }
.bkr-footer-brand h3 { color: #fff; font-size: 1.2rem; font-weight: 800; margin-bottom: 10px; }
.bkr-footer-brand span { color: #f59e0b; }
.bkr-footer-brand p { font-size: .81rem; line-height: 1.7; color: #a0b4c5; }
.bkr-footer-col h4 { color: #fff; font-size: .86rem; font-weight: 700; margin-bottom: 14px; }
.bkr-footer-col li { margin-bottom: 8px; }
.bkr-footer-col li a { color: #a0b4c5; font-size: .8rem; transition: color .2s; }
.bkr-footer-col li a:hover { color: #fff; }
.bkr-footer-bottom { border-top: 1px solid rgba(255,255,255,.08); padding-top: 22px; text-align: center; font-size: .76rem; color: #6a8499; }

/* RESPONSIVE */
@media (max-width: 900px) {
    .bkr-svc-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bkr-fleet-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bkr-testi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bkr-footer-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 700px) {
    .bkr-hero-inner { flex-direction: column !important; text-align: center; padding: 0 16px; }
    .bkr-hero-image { flex: 0 0 auto !important; width: 100%; max-width: 340px; margin: 0 auto; }
    .bkr-hero-actions { justify-content: center; }
    .bkr-hero-stats { justify-content: center; }
    .bkr-nav-links { display: none !important; }
    .bkr-steps::before { display: none; }
    .bkr-fleet-grid { grid-template-columns: 1fr !important; }
    .bkr-testi-grid { grid-template-columns: 1fr !important; }
    .bkr-footer-grid { grid-template-columns: 1fr !important; }
    .bkr-search-box { flex-direction: column !important; }
    .bkr-field { flex: 0 0 auto !important; width: 100%; }
}
</style>

<!-- NAVBAR -->
<nav class="bkr-nav">
  <div class="bkr-nav-inner">
    <span class="bkr-brand">⭐ Bintang <span class="bkr-brand-star">Kejora</span></span>
    <ul class="bkr-nav-links">
      <li><a href="#bkr-layanan">Layanan</a></li>
      <li><a href="#bkr-armada">Armada</a></li>
      <li><a href="#bkr-cara">Cara Sewa</a></li>
      <li><a href="#bkr-testimoni">Testimoni</a></li>
    </ul>
    <a href="#bkr-booking" class="bkr-btn-nav">Pesan Sekarang</a>
  </div>
</nav>

<!-- HERO -->
<section class="bkr-hero" id="bkr-hero">
  <div class="bkr-container">
    <div class="bkr-hero-inner">
      <div class="bkr-hero-content">
        <div class="bkr-badge"><span class="bkr-badge-dot"></span> Layanan Terpercaya #1</div>
        <h1 class="bkr-hero-title">Rental Mobil <span>Nyaman &amp; Terjangkau</span><br>Untuk Setiap Perjalanan</h1>
        <p class="bkr-hero-desc">Pilih dari ratusan armada mobil premium kami. Sopir profesional, armada terawat, harga transparan — perjalanan Anda adalah prioritas kami.</p>
        <div class="bkr-hero-actions">
          <a href="#bkr-armada" class="bkr-btn-primary">🚗 Lihat Armada</a>
          <a href="#bkr-cara" class="bkr-btn-outline">Cara Menyewa</a>
        </div>
        <div class="bkr-hero-stats">
          <div><div class="bkr-stat-num">500+</div><div class="bkr-stat-lbl">Unit Armada</div></div>
          <div><div class="bkr-stat-num">12K+</div><div class="bkr-stat-lbl">Pelanggan Puas</div></div>
          <div><div class="bkr-stat-num">50+</div><div class="bkr-stat-lbl">Kota Tersedia</div></div>
        </div>
      </div>
      <div class="bkr-hero-image">
        <div class="bkr-car-card">
          <span class="bkr-car-pill">⭐ Terpopuler</span>
          <div class="bkr-car-thumb">🚙</div>
          <div class="bkr-car-name">Toyota Innova Reborn</div>
          <div class="bkr-car-sub">7 Penumpang · Otomatis · BBM Diesel</div>
          <div class="bkr-car-footer">
            <div class="bkr-car-price">Rp 650.000 <small>/ hari</small></div>
            <a href="#bkr-booking" class="bkr-btn-book">Pesan</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SEARCH -->
<section class="bkr-search-section" id="bkr-booking">
  <div class="bkr-container">
    <div class="bkr-search-box">
      <div class="bkr-field"><label>Kota Penjemputan</label><select><option>Jakarta</option><option>Surabaya</option><option>Bandung</option><option>Bali</option><option>Yogyakarta</option></select></div>
      <div class="bkr-field"><label>Tanggal Mulai</label><input type="date" /></div>
      <div class="bkr-field"><label>Tanggal Selesai</label><input type="date" /></div>
      <div class="bkr-field"><label>Jenis Kendaraan</label><select><option>Semua Tipe</option><option>MPV</option><option>SUV</option><option>Sedan</option><option>City Car</option></select></div>
      <button class="bkr-btn-search">🔍 Cari Mobil</button>
    </div>
  </div>
</section>

<!-- LAYANAN -->
<section class="bkr-section bkr-section-bg" id="bkr-layanan">
  <div class="bkr-container">
    <div class="bkr-sec-head">
      <div class="bkr-sec-label">Layanan Kami</div>
      <h2 class="bkr-sec-title">Solusi Mobilitas Lengkap</h2>
      <p class="bkr-sec-sub">Dari perjalanan harian hingga perjalanan jauh, kami siap melayani kebutuhan Anda.</p>
    </div>
    <div class="bkr-svc-grid">
      <div class="bkr-svc-card"><div class="bkr-svc-icon">🚗</div><h3>Sewa Lepas Kunci</h3><p>Kebebasan penuh tanpa sopir. Ideal untuk Anda yang ingin eksplorasi sendiri.</p></div>
      <div class="bkr-svc-card"><div class="bkr-svc-icon">👤</div><h3>Dengan Sopir</h3><p>Sopir profesional berpengalaman siap mengantar Anda ke mana saja dengan aman.</p></div>
      <div class="bkr-svc-card"><div class="bkr-svc-icon">✈️</div><h3>Antar Jemput Bandara</h3><p>Layanan tepat waktu dari dan ke bandara di seluruh kota besar Indonesia.</p></div>
      <div class="bkr-svc-card"><div class="bkr-svc-icon">🗺️</div><h3>Wisata &amp; Outbound</h3><p>Paket wisata all-inclusive dengan armada nyaman dan pemandu perjalanan lokal.</p></div>
    </div>
  </div>
</section>

<!-- ARMADA -->
<section class="bkr-section bkr-section-white" id="bkr-armada">
  <div class="bkr-container">
    <div class="bkr-sec-head">
      <div class="bkr-sec-label">Armada Pilihan</div>
      <h2 class="bkr-sec-title">Kendaraan Berkualitas Untuk Anda</h2>
      <p class="bkr-sec-sub">Seluruh armada dirawat rutin dan siap memberikan kenyamanan perjalanan terbaik.</p>
    </div>
    <div class="bkr-fleet-grid">
      <div class="bkr-fleet-card"><div class="bkr-fleet-thumb">🚙</div><div class="bkr-fleet-body"><div class="bkr-fleet-cat">MPV Premium</div><h3>Toyota Innova Reborn</h3><div class="bkr-fleet-specs"><span class="bkr-spec">👥 7 Penumpang</span><span class="bkr-spec">⚙️ Otomatis</span><span class="bkr-spec">⛽ Diesel</span></div><div class="bkr-fleet-foot"><div class="bkr-price">Rp 650.000 <small>/ hari</small></div><a href="#bkr-booking" class="bkr-btn-book">Pesan</a></div></div></div>
      <div class="bkr-fleet-card"><div class="bkr-fleet-thumb">🚐</div><div class="bkr-fleet-body"><div class="bkr-fleet-cat">MPV Family</div><h3>Toyota Avanza</h3><div class="bkr-fleet-specs"><span class="bkr-spec">👥 7 Penumpang</span><span class="bkr-spec">⚙️ Manual</span><span class="bkr-spec">⛽ Bensin</span></div><div class="bkr-fleet-foot"><div class="bkr-price">Rp 380.000 <small>/ hari</small></div><a href="#bkr-booking" class="bkr-btn-book">Pesan</a></div></div></div>
      <div class="bkr-fleet-card"><div class="bkr-fleet-thumb">🏎️</div><div class="bkr-fleet-body"><div class="bkr-fleet-cat">SUV Mewah</div><h3>Toyota Fortuner</h3><div class="bkr-fleet-specs"><span class="bkr-spec">👥 7 Penumpang</span><span class="bkr-spec">⚙️ Otomatis</span><span class="bkr-spec">⛽ Diesel</span></div><div class="bkr-fleet-foot"><div class="bkr-price">Rp 900.000 <small>/ hari</small></div><a href="#bkr-booking" class="bkr-btn-book">Pesan</a></div></div></div>
      <div class="bkr-fleet-card"><div class="bkr-fleet-thumb">🚕</div><div class="bkr-fleet-body"><div class="bkr-fleet-cat">City Car</div><h3>Honda Brio</h3><div class="bkr-fleet-specs"><span class="bkr-spec">👥 4 Penumpang</span><span class="bkr-spec">⚙️ Otomatis</span><span class="bkr-spec">⛽ Bensin</span></div><div class="bkr-fleet-foot"><div class="bkr-price">Rp 280.000 <small>/ hari</small></div><a href="#bkr-booking" class="bkr-btn-book">Pesan</a></div></div></div>
      <div class="bkr-fleet-card"><div class="bkr-fleet-thumb">🚌</div><div class="bkr-fleet-body"><div class="bkr-fleet-cat">Minibus</div><h3>Toyota HiAce</h3><div class="bkr-fleet-specs"><span class="bkr-spec">👥 14 Penumpang</span><span class="bkr-spec">⚙️ Manual</span><span class="bkr-spec">⛽ Diesel</span></div><div class="bkr-fleet-foot"><div class="bkr-price">Rp 1.100.000 <small>/ hari</small></div><a href="#bkr-booking" class="bkr-btn-book">Pesan</a></div></div></div>
      <div class="bkr-fleet-card"><div class="bkr-fleet-thumb">🚗</div><div class="bkr-fleet-body"><div class="bkr-fleet-cat">Sedan Eksekutif</div><h3>Toyota Camry</h3><div class="bkr-fleet-specs"><span class="bkr-spec">👥 5 Penumpang</span><span class="bkr-spec">⚙️ Otomatis</span><span class="bkr-spec">⛽ Bensin</span></div><div class="bkr-fleet-foot"><div class="bkr-price">Rp 1.200.000 <small>/ hari</small></div><a href="#bkr-booking" class="bkr-btn-book">Pesan</a></div></div></div>
    </div>
  </div>
</section>

<!-- CARA SEWA -->
<section class="bkr-section bkr-section-blue" id="bkr-cara">
  <div class="bkr-container">
    <div class="bkr-sec-head">
      <div class="bkr-sec-label">Cara Menyewa</div>
      <h2 class="bkr-sec-title">Mudah, Cepat, Terpercaya</h2>
      <p class="bkr-sec-sub">4 langkah sederhana untuk mendapatkan mobil impian perjalanan Anda.</p>
    </div>
    <div class="bkr-steps">
      <div class="bkr-step"><div class="bkr-step-num">1</div><h4>Pilih Kendaraan</h4><p>Telusuri katalog armada dan sesuaikan dengan kebutuhan perjalanan Anda.</p></div>
      <div class="bkr-step"><div class="bkr-step-num">2</div><h4>Isi Formulir</h4><p>Lengkapi data diri, tanggal, dan lokasi penjemputan dengan mudah.</p></div>
      <div class="bkr-step"><div class="bkr-step-num">3</div><h4>Konfirmasi &amp; Bayar</h4><p>Bayar DP atau lunas melalui berbagai metode pembayaran yang tersedia.</p></div>
      <div class="bkr-step"><div class="bkr-step-num">4</div><h4>Mulai Perjalanan</h4><p>Tim kami mengantar mobil ke lokasi Anda. Selamat menikmati perjalanan!</p></div>
    </div>
  </div>
</section>

<!-- TESTIMONI -->
<section class="bkr-section bkr-section-white" id="bkr-testimoni">
  <div class="bkr-container">
    <div class="bkr-sec-head">
      <div class="bkr-sec-label">Testimoni Pelanggan</div>
      <h2 class="bkr-sec-title">Kata Mereka Tentang Kami</h2>
    </div>
    <div class="bkr-testi-grid">
      <div class="bkr-testi-card"><div class="bkr-stars">★★★★★</div><p class="bkr-testi-text">"Mobilnya bersih banget dan AC-nya dingin. Sopirnya juga ramah dan tepat waktu. Pasti sewa lagi!"</p><div class="bkr-testi-user"><div class="bkr-avatar">AR</div><div><div class="bkr-testi-name">Andi Rahmanto</div><div class="bkr-testi-role">Pelanggan · Jakarta</div></div></div></div>
      <div class="bkr-testi-card"><div class="bkr-stars">★★★★★</div><p class="bkr-testi-text">"Harga bersaing dan proses pemesanan sangat mudah. Fortuner yang kami sewa kondisinya prima untuk perjalanan keluarga."</p><div class="bkr-testi-user"><div class="bkr-avatar">SP</div><div><div class="bkr-testi-name">Sari Permata</div><div class="bkr-testi-role">Pelanggan · Surabaya</div></div></div></div>
      <div class="bkr-testi-card"><div class="bkr-stars">★★★★☆</div><p class="bkr-testi-text">"Layanan antar jemput bandara sangat membantu. Respons customer service cepat dan profesional."</p><div class="bkr-testi-user"><div class="bkr-avatar">BW</div><div><div class="bkr-testi-name">Bagus Wicaksono</div><div class="bkr-testi-role">Pelanggan · Yogyakarta</div></div></div></div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="bkr-cta">
  <div class="bkr-container">
    <h2>Siap Mulai Perjalanan Anda?</h2>
    <p>Pesan sekarang dan dapatkan promo spesial untuk pelanggan baru. Armada terbaik menanti Anda!</p>
    <a href="#bkr-booking" class="bkr-btn-cta">🚗 Pesan Sekarang</a>
  </div>
</section>

<!-- FOOTER -->
<footer class="bkr-footer">
  <div class="bkr-container">
    <div class="bkr-footer-grid">
      <div class="bkr-footer-brand">
        <h3>⭐ Bintang <span>Kejora</span></h3>
        <p>Rental mobil terpercaya dengan armada lengkap dan layanan profesional. Melayani seluruh Indonesia sejak 2015.</p>
      </div>
      <div class="bkr-footer-col"><h4>Layanan</h4><ul><li><a href="#">Sewa Lepas Kunci</a></li><li><a href="#">Dengan Sopir</a></li><li><a href="#">Antar Jemput Bandara</a></li><li><a href="#">Wisata &amp; Outbound</a></li></ul></div>
      <div class="bkr-footer-col"><h4>Armada</h4><ul><li><a href="#">MPV &amp; Minibus</a></li><li><a href="#">SUV</a></li><li><a href="#">Sedan</a></li><li><a href="#">City Car</a></li></ul></div>
      <div class="bkr-footer-col"><h4>Kontak</h4><ul><li><a href="#">📞 +62 812-3456-7890</a></li><li><a href="#">📧 info@bintangkejora.id</a></li><li><a href="#">📍 Jakarta, Indonesia</a></li><li><a href="#">💬 WhatsApp</a></li></ul></div>
    </div>
    <div class="bkr-footer-bottom">© 2025 Bintang Kejora. Seluruh hak cipta dilindungi.</div>
  </div>
</footer>

</div><!-- /.bkr-wrap -->
HTML;

        Page::updateOrCreate(
            ['slug' => 'home'],
            [
                'user_id' => $userId,
                'title' => 'Landing Page – Bintang Kejora',
                'html' => $html,
                'css' => '',
                'gjs_data' => null,
                'is_published' => true,
                'is_homepage' => true,
            ]
        );
    }
}

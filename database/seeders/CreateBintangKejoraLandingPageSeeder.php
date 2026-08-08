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
     */
    public function run(): void
    {
        // Ensure the pages table exists (important for tenant databases)
        if (! Schema::hasTable('pages')) {
            return;
        }

        // Prevent duplicate seeding
        if (Page::where('slug', 'home')->where('is_homepage', true)->exists()) {
            return;
        }

        // Use first available user as the page owner
        $userId = User::query()->value('id') ?? 1;

        // NOTE: render.blade.php extracts only the <body> content, so we must
        // NOT wrap the HTML in <html>/<head>/<body> tags.  All styles live in
        // the $css field (injected into <head> by the template) or in a
        // <style> block inside the fragment itself.  We prefix every class with
        // "bkr-" to avoid collisions with the Tailwind 2 CDN the template loads.
        $css = <<<'CSS'
/* ── Google Fonts ──────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

/* ── Reset scoped to our wrapper ───────────────────────── */
.bkr-wrap *, .bkr-wrap *::before, .bkr-wrap *::after {
  box-sizing: border-box;
}
.bkr-wrap { all: initial; display: block; }

/* ── CSS Variables ──────────────────────────────────────── */
.bkr-wrap {
  --bkr-primary:   #1e6fa8;
  --bkr-primary-l: #2d90d6;
  --bkr-accent:    #f59e0b;
  --bkr-bg:        #f4f8fb;
  --bkr-surface:   #ffffff;
  --bkr-text:      #1a2332;
  --bkr-muted:     #5a7184;
  --bkr-border:    #dce8f0;
  --bkr-radius:    14px;
  --bkr-sm:        0 2px 12px rgba(30,111,168,.08);
  --bkr-md:        0 8px 32px rgba(30,111,168,.14);
  --bkr-lg:        0 20px 60px rgba(30,111,168,.18);
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--bkr-text);
  background: var(--bkr-bg);
  line-height: 1.6;
}

/* ── Typography ─────────────────────────────────────────── */
.bkr-wrap h1,.bkr-wrap h2,.bkr-wrap h3,.bkr-wrap h4 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800; line-height: 1.15;
}
.bkr-wrap p { margin: 0; }
.bkr-wrap a { text-decoration: none; }
.bkr-wrap ul { list-style: none; margin: 0; padding: 0; }
.bkr-wrap img { max-width: 100%; display: block; }

/* ── NAVBAR ─────────────────────────────────────────────── */
.bkr-nav {
  position: sticky; top: 0; z-index: 200;
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--bkr-border);
  padding: 0 5%;
  display: flex; align-items: center; justify-content: space-between;
  height: 68px;
}
.bkr-brand {
  display: flex; align-items: center; gap: 8px;
  font-size: 1.3rem; font-weight: 800;
  color: var(--bkr-primary);
}
.bkr-brand .bkr-star { color: var(--bkr-accent); }
.bkr-nav-links { display: flex; gap: 26px; }
.bkr-nav-links a {
  font-size: .9rem; font-weight: 500;
  color: var(--bkr-muted); transition: color .2s;
}
.bkr-nav-links a:hover { color: var(--bkr-primary); }
.bkr-btn-nav {
  background: var(--bkr-primary); color: #fff !important;
  padding: 9px 22px; border-radius: 50px;
  font-size: .88rem; font-weight: 700;
  transition: background .2s, transform .15s;
}
.bkr-btn-nav:hover { background: var(--bkr-primary-l); transform: translateY(-1px); }

/* ── HERO ───────────────────────────────────────────────── */
.bkr-hero {
  min-height: 88vh;
  background: linear-gradient(135deg, #e8f4fd 0%, #f4f8fb 50%, #fef9ec 100%);
  display: flex; align-items: center;
  padding: 72px 5%;
  gap: 48px;
  position: relative; overflow: hidden;
}
.bkr-hero::before {
  content: '';
  position: absolute; top: -120px; right: -120px;
  width: 480px; height: 480px; border-radius: 50%;
  background: radial-gradient(circle, rgba(30,111,168,.07) 0%, transparent 70%);
  pointer-events: none;
}
.bkr-hero-content { flex: 1; max-width: 560px; }
.bkr-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(30,111,168,.09); color: var(--bkr-primary);
  padding: 6px 16px; border-radius: 50px;
  font-size: .75rem; font-weight: 700; letter-spacing: .5px;
  text-transform: uppercase; margin-bottom: 22px;
}
.bkr-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--bkr-accent); }
.bkr-hero h1 {
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  color: var(--bkr-text); margin-bottom: 18px;
}
.bkr-hero h1 span { color: var(--bkr-primary); }
.bkr-hero-desc {
  font-size: 1.02rem; color: var(--bkr-muted);
  margin-bottom: 34px; max-width: 460px;
}
.bkr-hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
.bkr-btn-primary {
  background: var(--bkr-primary); color: #fff !important;
  padding: 13px 30px; border-radius: 50px;
  font-size: .97rem; font-weight: 700;
  display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 6px 24px rgba(30,111,168,.30);
  transition: background .2s, transform .15s, box-shadow .2s;
}
.bkr-btn-primary:hover {
  background: var(--bkr-primary-l);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(30,111,168,.38);
}
.bkr-btn-outline {
  background: transparent; color: var(--bkr-primary) !important;
  padding: 13px 30px; border-radius: 50px;
  font-size: .97rem; font-weight: 600;
  border: 2px solid var(--bkr-primary);
  transition: background .2s, color .2s;
}
.bkr-btn-outline:hover { background: var(--bkr-primary); color: #fff !important; }
.bkr-hero-stats { display: flex; gap: 28px; margin-top: 44px; }
.bkr-stat-num { font-size: 1.75rem; font-weight: 800; color: var(--bkr-primary); }
.bkr-stat-lbl { font-size: .78rem; color: var(--bkr-muted); font-weight: 500; }
.bkr-hero-img { flex: 1; display: flex; justify-content: center; align-items: center; }
.bkr-car-card {
  background: var(--bkr-surface);
  border-radius: 22px; padding: 28px;
  box-shadow: var(--bkr-lg);
  max-width: 400px; width: 100%; position: relative;
}
.bkr-car-pill {
  position: absolute; top: 18px; left: 18px;
  background: var(--bkr-accent); color: #fff;
  font-size: .72rem; font-weight: 700; padding: 4px 12px;
  border-radius: 50px; letter-spacing: .4px;
}
.bkr-car-thumb {
  background: linear-gradient(135deg,#e8f4fd,#dce8f0);
  border-radius: 14px; padding: 24px;
  font-size: 4.5rem; text-align: center; line-height: 1;
}
.bkr-car-name { font-size: 1.1rem; font-weight: 700; margin: 16px 0 4px; }
.bkr-car-sub { font-size: .8rem; color: var(--bkr-muted); }
.bkr-car-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid var(--bkr-border);
}
.bkr-car-price { font-size: 1.15rem; font-weight: 800; color: var(--bkr-primary); }
.bkr-car-price small { font-size: .75rem; font-weight: 500; color: var(--bkr-muted); }
.bkr-btn-book {
  background: var(--bkr-primary); color: #fff !important;
  padding: 8px 18px; border-radius: 8px;
  font-size: .82rem; font-weight: 700;
  transition: background .2s;
}
.bkr-btn-book:hover { background: var(--bkr-primary-l); }

/* ── SEARCH ─────────────────────────────────────────────── */
.bkr-search-wrap {
  background: var(--bkr-surface);
  padding: 0 5% 40px;
}
.bkr-search-box {
  max-width: 880px; margin: 0 auto;
  background: var(--bkr-surface);
  border-radius: var(--bkr-radius);
  box-shadow: var(--bkr-md);
  border: 1px solid var(--bkr-border);
  padding: 22px 26px;
  display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap;
  transform: translateY(-44px);
}
.bkr-field { flex: 1; min-width: 150px; }
.bkr-field label {
  display: block; font-size: .72rem; font-weight: 700;
  color: var(--bkr-muted); text-transform: uppercase; letter-spacing: .5px;
  margin-bottom: 6px;
}
.bkr-field input, .bkr-field select {
  width: 100%; padding: 9px 13px;
  border: 1.5px solid var(--bkr-border); border-radius: 9px;
  font-size: .9rem; font-family: inherit; color: var(--bkr-text);
  background: var(--bkr-bg); outline: none;
  transition: border-color .2s;
}
.bkr-field input:focus, .bkr-field select:focus { border-color: var(--bkr-primary); }
.bkr-btn-search {
  background: var(--bkr-primary); color: #fff;
  padding: 10px 26px; border-radius: 9px;
  font-size: .93rem; font-weight: 700; border: none; cursor: pointer;
  font-family: inherit; white-space: nowrap;
  transition: background .2s, transform .15s;
}
.bkr-btn-search:hover { background: var(--bkr-primary-l); transform: translateY(-1px); }

/* ── SECTION COMMONS ────────────────────────────────────── */
.bkr-section { padding: 72px 5%; }
.bkr-section-bg { background: var(--bkr-bg); }
.bkr-section-white { background: var(--bkr-surface); }
.bkr-section-blue { background: linear-gradient(135deg,#e8f4fd,#f4f8fb); }
.bkr-sec-head { text-align: center; margin-bottom: 52px; }
.bkr-sec-label {
  font-size: .74rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; color: var(--bkr-primary); margin-bottom: 10px;
}
.bkr-sec-title {
  font-size: clamp(1.5rem, 3.5vw, 2.3rem);
  font-weight: 800; color: var(--bkr-text);
}
.bkr-sec-sub { color: var(--bkr-muted); margin-top: 10px; max-width: 500px; margin-left: auto; margin-right: auto; font-size: .95rem; }

/* ── SERVICE CARDS ──────────────────────────────────────── */
.bkr-svc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 22px; max-width: 1080px; margin: 0 auto;
}
.bkr-svc-card {
  background: var(--bkr-surface);
  border-radius: var(--bkr-radius); padding: 30px 22px;
  box-shadow: var(--bkr-sm); border: 1px solid var(--bkr-border);
  text-align: center;
  transition: transform .25s, box-shadow .25s;
}
.bkr-svc-card:hover { transform: translateY(-6px); box-shadow: var(--bkr-md); }
.bkr-svc-icon {
  width: 58px; height: 58px; border-radius: 15px;
  background: linear-gradient(135deg, var(--bkr-primary), var(--bkr-primary-l));
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.55rem; margin-bottom: 18px;
}
.bkr-svc-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: var(--bkr-text); }
.bkr-svc-card p { font-size: .85rem; color: var(--bkr-muted); }

/* ── FLEET CARDS ────────────────────────────────────────── */
.bkr-fleet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 22px; max-width: 1080px; margin: 0 auto;
}
.bkr-fleet-card {
  background: var(--bkr-bg);
  border-radius: var(--bkr-radius); overflow: hidden;
  border: 1px solid var(--bkr-border); box-shadow: var(--bkr-sm);
  transition: transform .25s, box-shadow .25s;
}
.bkr-fleet-card:hover { transform: translateY(-6px); box-shadow: var(--bkr-md); }
.bkr-fleet-thumb {
  background: linear-gradient(135deg,#e8f4fd,#dce8f0);
  padding: 24px 20px 14px;
  font-size: 3.8rem; text-align: center; line-height: 1;
  min-height: 120px; display: flex; align-items: center; justify-content: center;
}
.bkr-fleet-body { padding: 18px; }
.bkr-fleet-cat {
  font-size: .68rem; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: var(--bkr-primary); margin-bottom: 5px;
}
.bkr-fleet-body h3 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: var(--bkr-text); }
.bkr-fleet-specs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.bkr-spec { font-size: .73rem; color: var(--bkr-muted); display: flex; align-items: center; gap: 3px; }
.bkr-fleet-foot {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 12px; border-top: 1px solid var(--bkr-border);
}
.bkr-price { font-weight: 800; color: var(--bkr-primary); font-size: .95rem; }
.bkr-price small { font-size: .72rem; font-weight: 500; color: var(--bkr-muted); }

/* ── HOW IT WORKS ───────────────────────────────────────── */
.bkr-steps {
  display: flex; gap: 0; max-width: 860px; margin: 0 auto;
  position: relative; flex-wrap: wrap; justify-content: center;
}
.bkr-steps::before {
  content: '';
  position: absolute; top: 35px; left: 13%; right: 13%; height: 2px;
  background: linear-gradient(90deg, var(--bkr-primary), var(--bkr-primary-l));
}
.bkr-step { flex: 1; min-width: 150px; text-align: center; position: relative; z-index: 1; padding: 0 14px; }
.bkr-step-num {
  width: 70px; height: 70px; border-radius: 50%;
  background: var(--bkr-primary); color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.45rem; font-weight: 800; margin-bottom: 14px;
  box-shadow: 0 6px 20px rgba(30,111,168,.26);
  border: 4px solid var(--bkr-bg);
}
.bkr-step h4 { font-size: .92rem; font-weight: 700; margin-bottom: 6px; color: var(--bkr-text); }
.bkr-step p { font-size: .8rem; color: var(--bkr-muted); }

/* ── TESTIMONIALS ───────────────────────────────────────── */
.bkr-testi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px; max-width: 980px; margin: 0 auto;
}
.bkr-testi-card {
  background: var(--bkr-bg); border-radius: var(--bkr-radius);
  padding: 26px 22px; border: 1px solid var(--bkr-border); box-shadow: var(--bkr-sm);
}
.bkr-stars { color: var(--bkr-accent); font-size: 1.05rem; margin-bottom: 12px; }
.bkr-testi-text { font-size: .88rem; color: var(--bkr-muted); margin-bottom: 18px; font-style: italic; }
.bkr-testi-user { display: flex; align-items: center; gap: 10px; }
.bkr-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg,var(--bkr-primary),var(--bkr-primary-l));
  display: flex; align-items: center; justify-content: center;
  font-size: .9rem; color: #fff; font-weight: 700;
}
.bkr-testi-name { font-weight: 700; font-size: .88rem; color: var(--bkr-text); }
.bkr-testi-role { font-size: .76rem; color: var(--bkr-muted); }

/* ── CTA SECTION ────────────────────────────────────────── */
.bkr-cta {
  background: linear-gradient(135deg,var(--bkr-primary) 0%,var(--bkr-primary-l) 100%);
  padding: 72px 5%; text-align: center; color: #fff;
}
.bkr-cta h2 { font-size: clamp(1.7rem, 4vw, 2.6rem); margin-bottom: 14px; color: #fff; }
.bkr-cta p { font-size: .97rem; opacity: .85; max-width: 460px; margin: 0 auto 32px; }
.bkr-btn-cta {
  background: #fff; color: var(--bkr-primary) !important;
  padding: 13px 34px; border-radius: 50px;
  font-size: .97rem; font-weight: 700;
  box-shadow: 0 8px 24px rgba(0,0,0,.16);
  display: inline-block; transition: transform .2s, box-shadow .2s;
}
.bkr-btn-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,.22); }

/* ── FOOTER ─────────────────────────────────────────────── */
.bkr-footer {
  background: #0f1e2d; color: #a0b4c5;
  padding: 56px 5% 30px;
}
.bkr-footer-grid {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: 36px; max-width: 1080px; margin: 0 auto 44px;
}
.bkr-footer-brand h3 { color: #fff; font-size: 1.25rem; font-weight: 800; margin-bottom: 10px; }
.bkr-footer-brand span { color: var(--bkr-accent); }
.bkr-footer-brand p { font-size: .83rem; line-height: 1.7; color: #a0b4c5; }
.bkr-footer-col h4 { color: #fff; font-size: .88rem; font-weight: 700; margin-bottom: 14px; }
.bkr-footer-col ul li { margin-bottom: 8px; }
.bkr-footer-col ul li a { color: #a0b4c5; font-size: .82rem; transition: color .2s; }
.bkr-footer-col ul li a:hover { color: #fff; }
.bkr-footer-bottom {
  border-top: 1px solid rgba(255,255,255,.08);
  padding-top: 24px; text-align: center;
  font-size: .78rem; color: #6a8499;
  max-width: 1080px; margin: 0 auto;
}

/* ── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 768px) {
  .bkr-hero { flex-direction: column; padding: 52px 5% 36px; text-align: center; min-height: auto; }
  .bkr-hero-actions { justify-content: center; }
  .bkr-hero-stats { justify-content: center; }
  .bkr-hero-img { width: 100%; }
  .bkr-nav-links { display: none; }
  .bkr-search-box { transform: none; margin: 24px auto; }
  .bkr-steps::before { display: none; }
  .bkr-footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 480px) {
  .bkr-footer-grid { grid-template-columns: 1fr; }
  .bkr-hero-stats { flex-wrap: wrap; gap: 20px; }
}
CSS;

        $html = <<<'HTML'
<div class="bkr-wrap">

<!-- NAVBAR -->
<nav class="bkr-nav">
  <div class="bkr-brand">⭐ Bintang <span class="bkr-star">Kejora</span></div>
  <ul class="bkr-nav-links">
    <li><a href="#bkr-layanan">Layanan</a></li>
    <li><a href="#bkr-armada">Armada</a></li>
    <li><a href="#bkr-cara">Cara Sewa</a></li>
    <li><a href="#bkr-testimoni">Testimoni</a></li>
  </ul>
  <a href="#bkr-booking" class="bkr-btn-nav">Pesan Sekarang</a>
</nav>

<!-- HERO -->
<section class="bkr-hero" id="bkr-hero">
  <div class="bkr-hero-content">
    <div class="bkr-badge"><span class="bkr-badge-dot"></span> Layanan Terpercaya #1</div>
    <h1>Rental Mobil <span>Nyaman &amp; Terjangkau</span> Untuk Setiap Perjalanan</h1>
    <p class="bkr-hero-desc">Pilih dari ratusan armada mobil premium kami. Sopir profesional, armada terawat, harga transparan — perjalanan Anda adalah prioritas kami.</p>
    <div class="bkr-hero-actions">
      <a href="#bkr-armada" class="bkr-btn-primary">🚗 Lihat Armada</a>
      <a href="#bkr-cara" class="bkr-btn-outline">Cara Menyewa</a>
    </div>
    <div class="bkr-hero-stats">
      <div>
        <div class="bkr-stat-num">500+</div>
        <div class="bkr-stat-lbl">Unit Armada</div>
      </div>
      <div>
        <div class="bkr-stat-num">12K+</div>
        <div class="bkr-stat-lbl">Pelanggan Puas</div>
      </div>
      <div>
        <div class="bkr-stat-num">50+</div>
        <div class="bkr-stat-lbl">Kota Tersedia</div>
      </div>
    </div>
  </div>
  <div class="bkr-hero-img">
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
</section>

<!-- SEARCH -->
<div class="bkr-search-wrap" id="bkr-booking">
  <div class="bkr-search-box">
    <div class="bkr-field">
      <label>Kota Penjemputan</label>
      <select>
        <option>Jakarta</option><option>Surabaya</option><option>Bandung</option>
        <option>Bali</option><option>Yogyakarta</option>
      </select>
    </div>
    <div class="bkr-field">
      <label>Tanggal Mulai</label>
      <input type="date" />
    </div>
    <div class="bkr-field">
      <label>Tanggal Selesai</label>
      <input type="date" />
    </div>
    <div class="bkr-field">
      <label>Jenis Kendaraan</label>
      <select>
        <option>Semua Tipe</option><option>MPV</option><option>SUV</option>
        <option>Sedan</option><option>City Car</option>
      </select>
    </div>
    <button class="bkr-btn-search">🔍 Cari Mobil</button>
  </div>
</div>

<!-- LAYANAN -->
<section class="bkr-section bkr-section-bg" id="bkr-layanan" style="padding-top:8px;">
  <div class="bkr-sec-head">
    <div class="bkr-sec-label">Layanan Kami</div>
    <h2 class="bkr-sec-title">Solusi Mobilitas Lengkap</h2>
    <p class="bkr-sec-sub">Dari perjalanan harian hingga perjalanan jauh, kami siap melayani kebutuhan Anda.</p>
  </div>
  <div class="bkr-svc-grid">
    <div class="bkr-svc-card">
      <div class="bkr-svc-icon">🚗</div>
      <h3>Sewa Lepas Kunci</h3>
      <p>Kebebasan penuh tanpa sopir. Ideal untuk Anda yang ingin eksplorasi sendiri.</p>
    </div>
    <div class="bkr-svc-card">
      <div class="bkr-svc-icon">👤</div>
      <h3>Dengan Sopir</h3>
      <p>Sopir profesional berpengalaman siap mengantar Anda ke mana saja dengan aman.</p>
    </div>
    <div class="bkr-svc-card">
      <div class="bkr-svc-icon">✈️</div>
      <h3>Antar Jemput Bandara</h3>
      <p>Layanan tepat waktu dari dan ke bandara di seluruh kota besar Indonesia.</p>
    </div>
    <div class="bkr-svc-card">
      <div class="bkr-svc-icon">🗺️</div>
      <h3>Wisata &amp; Outbound</h3>
      <p>Paket wisata all-inclusive dengan armada nyaman dan pemandu perjalanan lokal.</p>
    </div>
  </div>
</section>

<!-- ARMADA -->
<section class="bkr-section bkr-section-white" id="bkr-armada">
  <div class="bkr-sec-head">
    <div class="bkr-sec-label">Armada Pilihan</div>
    <h2 class="bkr-sec-title">Kendaraan Berkualitas Untuk Anda</h2>
    <p class="bkr-sec-sub">Seluruh armada dirawat rutin dan siap memberikan kenyamanan perjalanan terbaik.</p>
  </div>
  <div class="bkr-fleet-grid">
    <div class="bkr-fleet-card">
      <div class="bkr-fleet-thumb">🚙</div>
      <div class="bkr-fleet-body">
        <div class="bkr-fleet-cat">MPV Premium</div>
        <h3>Toyota Innova Reborn</h3>
        <div class="bkr-fleet-specs">
          <span class="bkr-spec">👥 7 Penumpang</span>
          <span class="bkr-spec">⚙️ Otomatis</span>
          <span class="bkr-spec">⛽ Diesel</span>
        </div>
        <div class="bkr-fleet-foot">
          <div class="bkr-price">Rp 650.000 <small>/ hari</small></div>
          <a href="#bkr-booking" class="bkr-btn-book">Pesan</a>
        </div>
      </div>
    </div>
    <div class="bkr-fleet-card">
      <div class="bkr-fleet-thumb">🚐</div>
      <div class="bkr-fleet-body">
        <div class="bkr-fleet-cat">MPV Family</div>
        <h3>Toyota Avanza</h3>
        <div class="bkr-fleet-specs">
          <span class="bkr-spec">👥 7 Penumpang</span>
          <span class="bkr-spec">⚙️ Manual</span>
          <span class="bkr-spec">⛽ Bensin</span>
        </div>
        <div class="bkr-fleet-foot">
          <div class="bkr-price">Rp 380.000 <small>/ hari</small></div>
          <a href="#bkr-booking" class="bkr-btn-book">Pesan</a>
        </div>
      </div>
    </div>
    <div class="bkr-fleet-card">
      <div class="bkr-fleet-thumb">🏎️</div>
      <div class="bkr-fleet-body">
        <div class="bkr-fleet-cat">SUV Mewah</div>
        <h3>Toyota Fortuner</h3>
        <div class="bkr-fleet-specs">
          <span class="bkr-spec">👥 7 Penumpang</span>
          <span class="bkr-spec">⚙️ Otomatis</span>
          <span class="bkr-spec">⛽ Diesel</span>
        </div>
        <div class="bkr-fleet-foot">
          <div class="bkr-price">Rp 900.000 <small>/ hari</small></div>
          <a href="#bkr-booking" class="bkr-btn-book">Pesan</a>
        </div>
      </div>
    </div>
    <div class="bkr-fleet-card">
      <div class="bkr-fleet-thumb">🚕</div>
      <div class="bkr-fleet-body">
        <div class="bkr-fleet-cat">City Car</div>
        <h3>Honda Brio</h3>
        <div class="bkr-fleet-specs">
          <span class="bkr-spec">👥 4 Penumpang</span>
          <span class="bkr-spec">⚙️ Otomatis</span>
          <span class="bkr-spec">⛽ Bensin</span>
        </div>
        <div class="bkr-fleet-foot">
          <div class="bkr-price">Rp 280.000 <small>/ hari</small></div>
          <a href="#bkr-booking" class="bkr-btn-book">Pesan</a>
        </div>
      </div>
    </div>
    <div class="bkr-fleet-card">
      <div class="bkr-fleet-thumb">🚌</div>
      <div class="bkr-fleet-body">
        <div class="bkr-fleet-cat">Minibus</div>
        <h3>Toyota HiAce</h3>
        <div class="bkr-fleet-specs">
          <span class="bkr-spec">👥 14 Penumpang</span>
          <span class="bkr-spec">⚙️ Manual</span>
          <span class="bkr-spec">⛽ Diesel</span>
        </div>
        <div class="bkr-fleet-foot">
          <div class="bkr-price">Rp 1.100.000 <small>/ hari</small></div>
          <a href="#bkr-booking" class="bkr-btn-book">Pesan</a>
        </div>
      </div>
    </div>
    <div class="bkr-fleet-card">
      <div class="bkr-fleet-thumb">🚗</div>
      <div class="bkr-fleet-body">
        <div class="bkr-fleet-cat">Sedan Eksekutif</div>
        <h3>Toyota Camry</h3>
        <div class="bkr-fleet-specs">
          <span class="bkr-spec">👥 5 Penumpang</span>
          <span class="bkr-spec">⚙️ Otomatis</span>
          <span class="bkr-spec">⛽ Bensin</span>
        </div>
        <div class="bkr-fleet-foot">
          <div class="bkr-price">Rp 1.200.000 <small>/ hari</small></div>
          <a href="#bkr-booking" class="bkr-btn-book">Pesan</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CARA SEWA -->
<section class="bkr-section bkr-section-blue" id="bkr-cara">
  <div class="bkr-sec-head">
    <div class="bkr-sec-label">Cara Menyewa</div>
    <h2 class="bkr-sec-title">Mudah, Cepat, Terpercaya</h2>
    <p class="bkr-sec-sub">4 langkah sederhana untuk mendapatkan mobil impian perjalanan Anda.</p>
  </div>
  <div class="bkr-steps">
    <div class="bkr-step">
      <div class="bkr-step-num">1</div>
      <h4>Pilih Kendaraan</h4>
      <p>Telusuri katalog armada dan sesuaikan dengan kebutuhan perjalanan Anda.</p>
    </div>
    <div class="bkr-step">
      <div class="bkr-step-num">2</div>
      <h4>Isi Formulir</h4>
      <p>Lengkapi data diri, tanggal, dan lokasi penjemputan dengan mudah.</p>
    </div>
    <div class="bkr-step">
      <div class="bkr-step-num">3</div>
      <h4>Konfirmasi &amp; Bayar</h4>
      <p>Bayar DP atau lunas melalui berbagai metode pembayaran yang tersedia.</p>
    </div>
    <div class="bkr-step">
      <div class="bkr-step-num">4</div>
      <h4>Mulai Perjalanan</h4>
      <p>Tim kami mengantar mobil ke lokasi Anda. Selamat menikmati perjalanan!</p>
    </div>
  </div>
</section>

<!-- TESTIMONI -->
<section class="bkr-section bkr-section-white" id="bkr-testimoni">
  <div class="bkr-sec-head">
    <div class="bkr-sec-label">Testimoni Pelanggan</div>
    <h2 class="bkr-sec-title">Kata Mereka Tentang Kami</h2>
  </div>
  <div class="bkr-testi-grid">
    <div class="bkr-testi-card">
      <div class="bkr-stars">★★★★★</div>
      <p class="bkr-testi-text">"Mobilnya bersih banget dan AC-nya dingin. Sopirnya juga ramah dan tepat waktu. Pasti sewa lagi!"</p>
      <div class="bkr-testi-user">
        <div class="bkr-avatar">AR</div>
        <div>
          <div class="bkr-testi-name">Andi Rahmanto</div>
          <div class="bkr-testi-role">Pelanggan · Jakarta</div>
        </div>
      </div>
    </div>
    <div class="bkr-testi-card">
      <div class="bkr-stars">★★★★★</div>
      <p class="bkr-testi-text">"Harga bersaing dan proses pemesanan sangat mudah. Fortuner yang kami sewa kondisinya prima untuk perjalanan keluarga."</p>
      <div class="bkr-testi-user">
        <div class="bkr-avatar">SP</div>
        <div>
          <div class="bkr-testi-name">Sari Permata</div>
          <div class="bkr-testi-role">Pelanggan · Surabaya</div>
        </div>
      </div>
    </div>
    <div class="bkr-testi-card">
      <div class="bkr-stars">★★★★☆</div>
      <p class="bkr-testi-text">"Layanan antar jemput bandara sangat membantu. Respons customer service cepat dan profesional."</p>
      <div class="bkr-testi-user">
        <div class="bkr-avatar">BW</div>
        <div>
          <div class="bkr-testi-name">Bagus Wicaksono</div>
          <div class="bkr-testi-role">Pelanggan · Yogyakarta</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="bkr-cta">
  <h2>Siap Mulai Perjalanan Anda?</h2>
  <p>Pesan sekarang dan dapatkan promo spesial untuk pelanggan baru. Armada terbaik menanti Anda!</p>
  <a href="#bkr-booking" class="bkr-btn-cta">🚗 Pesan Sekarang</a>
</section>

<!-- FOOTER -->
<footer class="bkr-footer">
  <div class="bkr-footer-grid">
    <div class="bkr-footer-brand">
      <h3>⭐ Bintang <span>Kejora</span></h3>
      <p>Rental mobil terpercaya dengan armada lengkap dan layanan profesional. Melayani seluruh Indonesia sejak 2015.</p>
    </div>
    <div class="bkr-footer-col">
      <h4>Layanan</h4>
      <ul>
        <li><a href="#">Sewa Lepas Kunci</a></li>
        <li><a href="#">Dengan Sopir</a></li>
        <li><a href="#">Antar Jemput Bandara</a></li>
        <li><a href="#">Wisata &amp; Outbound</a></li>
      </ul>
    </div>
    <div class="bkr-footer-col">
      <h4>Armada</h4>
      <ul>
        <li><a href="#">MPV &amp; Minibus</a></li>
        <li><a href="#">SUV</a></li>
        <li><a href="#">Sedan</a></li>
        <li><a href="#">City Car</a></li>
      </ul>
    </div>
    <div class="bkr-footer-col">
      <h4>Kontak</h4>
      <ul>
        <li><a href="#">📞 +62 812-3456-7890</a></li>
        <li><a href="#">📧 info@bintangkejora.id</a></li>
        <li><a href="#">📍 Jakarta, Indonesia</a></li>
        <li><a href="#">💬 WhatsApp</a></li>
      </ul>
    </div>
  </div>
  <div class="bkr-footer-bottom">
    © 2025 Bintang Kejora. Seluruh hak cipta dilindungi.
  </div>
</footer>

</div><!-- /.bkr-wrap -->
HTML;

        Page::create([
            'user_id' => $userId,
            'title' => 'Landing Page – Bintang Kejora',
            'slug' => 'home',
            'html' => $html,
            'css' => $css,
            'gjs_data' => json_encode([]),
            'is_published' => true,
            'is_homepage' => true,
        ]);
    }
}

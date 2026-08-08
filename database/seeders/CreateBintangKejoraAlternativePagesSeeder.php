<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Pages\Models\Page;

class CreateBintangKejoraAlternativePagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (! Schema::hasTable('pages')) {
            return;
        }

        $userId = User::query()->value('id') ?? 1;

        $this->createPremiumDark($userId);
        $this->createWarmTropical($userId);
        $this->createCleanMinimal($userId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Template 2: Elegan Gelap (Dark Navy + Gold)
    // ─────────────────────────────────────────────────────────────────────
    private function createPremiumDark(int $userId): void
    {
        if (Page::where('slug', 'landing-premium-dark')->exists()) {
            return;
        }

        $css = <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.bk2-wrap, .bk2-wrap > * {
    display: block !important;
    flex-direction: unset !important;
    flex-grow: unset !important;
    flex-shrink: unset !important;
    min-width: unset !important;
}
.bk2-wrap *, .bk2-wrap *::before, .bk2-wrap *::after { box-sizing: border-box; }
.bk2-wrap {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #f0f4f8;
    background: #0b1622;
    line-height: 1.6;
    width: 100%;
}
.bk2-wrap h1,.bk2-wrap h2,.bk2-wrap h3,.bk2-wrap h4 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin: 0; padding: 0;
}
.bk2-wrap p { margin: 0; padding: 0; }
.bk2-wrap a { text-decoration: none; }
.bk2-wrap ul { list-style: none; margin: 0; padding: 0; }

.bk2-container {
    width: 100%;
    max-width: 1140px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 24px;
    padding-right: 24px;
}

/* NAVBAR */
.bk2-nav {
    display: flex !important;
    align-items: center;
    position: sticky; top: 0; z-index: 200;
    background: rgba(11,22,34,.95);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(212,160,23,.2);
    height: 68px; width: 100%;
}
.bk2-nav-inner {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    width: 100%; max-width: 1140px;
    margin: 0 auto; padding: 0 24px;
}
.bk2-brand { font-size: 1.3rem; font-weight: 800; color: #d4a017; display: flex !important; align-items: center; gap: 6px; }
.bk2-nav-links { display: flex !important; gap: 28px; align-items: center; }
.bk2-nav-links a { font-size: .88rem; font-weight: 500; color: #94a3b8; transition: color .2s; }
.bk2-nav-links a:hover { color: #d4a017; }
.bk2-btn-nav { background: #d4a017; color: #0b1622 !important; padding: 9px 22px; border-radius: 50px; font-size: .86rem; font-weight: 700; transition: background .2s, transform .15s; white-space: nowrap; }
.bk2-btn-nav:hover { background: #e8b820; transform: translateY(-1px); }

/* HERO */
.bk2-hero {
    background: linear-gradient(135deg, #0b1622 0%, #0f2035 50%, #0b1a2d 100%);
    padding: 88px 0 72px;
    position: relative; overflow: hidden; width: 100%;
}
.bk2-hero::before {
    content: '';
    position: absolute; top: -80px; right: -60px;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,160,23,.08) 0%, transparent 65%);
    pointer-events: none;
}
.bk2-hero::after {
    content: '';
    position: absolute; bottom: -80px; left: -60px;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(30,144,214,.06) 0%, transparent 65%);
    pointer-events: none;
}
.bk2-hero-inner { display: flex !important; align-items: center; gap: 52px; position: relative; z-index: 1; }
.bk2-hero-content { flex: 1; min-width: 0; }
.bk2-hero-image { flex: 0 0 400px; }
.bk2-badge {
    display: inline-flex !important; align-items: center; gap: 8px;
    background: rgba(212,160,23,.12); color: #d4a017;
    padding: 6px 16px; border-radius: 50px;
    font-size: .72rem; font-weight: 700; letter-spacing: .5px;
    text-transform: uppercase; margin-bottom: 22px;
}
.bk2-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #d4a017; display: inline-block !important; }
.bk2-hero-title { font-size: clamp(1.9rem, 3.8vw, 3.1rem); font-weight: 800; color: #f0f4f8; line-height: 1.15; margin-bottom: 18px; }
.bk2-hero-title span { color: #d4a017; }
.bk2-hero-desc { font-size: 1rem; color: #94a3b8; margin-bottom: 34px; max-width: 460px; }
.bk2-hero-actions { display: flex !important; gap: 14px; flex-wrap: wrap; margin-bottom: 44px; }
.bk2-btn-primary { background: #d4a017; color: #0b1622 !important; padding: 13px 28px; border-radius: 50px; font-size: .95rem; font-weight: 700; display: inline-flex !important; align-items: center; gap: 8px; box-shadow: 0 6px 20px rgba(212,160,23,.28); transition: background .2s, transform .15s; }
.bk2-btn-primary:hover { background: #e8b820; transform: translateY(-2px); }
.bk2-btn-outline { background: transparent; color: #d4a017 !important; padding: 13px 28px; border-radius: 50px; font-size: .95rem; font-weight: 600; border: 2px solid #d4a017; transition: background .2s, color .2s; }
.bk2-btn-outline:hover { background: #d4a017; color: #0b1622 !important; }
.bk2-hero-stats { display: flex !important; gap: 32px; flex-wrap: wrap; }
.bk2-stat-num { font-size: 1.7rem; font-weight: 800; color: #d4a017; }
.bk2-stat-lbl { font-size: .76rem; color: #64748b; font-weight: 500; }

/* Hero card */
.bk2-car-card { background: #111f30; border-radius: 22px; padding: 26px; border: 1px solid rgba(212,160,23,.2); box-shadow: 0 20px 60px rgba(0,0,0,.4); position: relative; width: 100%; }
.bk2-car-pill { position: absolute; top: 16px; left: 16px; background: #d4a017; color: #0b1622; font-size: .7rem; font-weight: 700; padding: 3px 12px; border-radius: 50px; }
.bk2-car-thumb { background: linear-gradient(135deg, #111f30, #1a2d42); border-radius: 14px; padding: 22px; font-size: 4.5rem; text-align: center; line-height: 1; border: 1px solid rgba(212,160,23,.1); }
.bk2-car-name { font-size: 1.05rem; font-weight: 700; margin: 14px 0 4px; color: #f0f4f8; }
.bk2-car-sub { font-size: .78rem; color: #64748b; }
.bk2-car-footer { display: flex !important; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(212,160,23,.15); }
.bk2-car-price { font-size: 1.1rem; font-weight: 800; color: #d4a017; }
.bk2-car-price small { font-size: .72rem; font-weight: 500; color: #64748b; }
.bk2-btn-book { background: #d4a017; color: #0b1622 !important; padding: 8px 18px; border-radius: 8px; font-size: .8rem; font-weight: 700; transition: background .2s; }
.bk2-btn-book:hover { background: #e8b820; }

/* SEARCH */
.bk2-search-section { background: #0b1622; padding: 0 0 24px; width: 100%; }
.bk2-search-box { background: #111f30; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,.3); border: 1px solid rgba(212,160,23,.15); padding: 22px 26px; display: flex !important; gap: 14px; align-items: flex-end; flex-wrap: wrap; margin-top: -36px; position: relative; z-index: 10; }
.bk2-field { flex: 1 1 140px; min-width: 0; }
.bk2-field label { display: block; font-size: .7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.bk2-field input, .bk2-field select { width: 100%; padding: 9px 12px; border: 1.5px solid rgba(212,160,23,.2); border-radius: 9px; font-size: .88rem; font-family: inherit; color: #f0f4f8; background: #0b1622; outline: none; transition: border-color .2s; appearance: auto; }
.bk2-field input:focus, .bk2-field select:focus { border-color: #d4a017; }
.bk2-field select option { background: #0b1622; }
.bk2-btn-search { background: #d4a017; color: #0b1622; padding: 10px 24px; border-radius: 9px; font-size: .9rem; font-weight: 700; border: none; cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0; transition: background .2s; }
.bk2-btn-search:hover { background: #e8b820; }

/* SECTIONS */
.bk2-section { padding: 72px 0; width: 100%; }
.bk2-section-dark { background: #0b1622; }
.bk2-section-darker { background: #07101a; }
.bk2-section-mid { background: #0f1d2e; }
.bk2-sec-head { text-align: center; margin-bottom: 52px; }
.bk2-sec-label { font-size: .72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #d4a017; margin-bottom: 10px; }
.bk2-sec-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #f0f4f8; }
.bk2-sec-sub { color: #64748b; margin-top: 10px; font-size: .93rem; max-width: 500px; margin-left: auto !important; margin-right: auto !important; text-align: center !important; display: block !important; }

/* SERVICE CARDS */
.bk2-svc-grid { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 22px; }
.bk2-svc-card { background: #111f30; border-radius: 14px; padding: 28px 22px; border: 1px solid rgba(212,160,23,.12); text-align: center; transition: transform .25s, border-color .25s, box-shadow .25s; }
.bk2-svc-card:hover { transform: translateY(-6px); border-color: rgba(212,160,23,.35); box-shadow: 0 8px 32px rgba(212,160,23,.1); }
.bk2-svc-icon { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, rgba(212,160,23,.2), rgba(212,160,23,.08)); border: 1px solid rgba(212,160,23,.25); display: inline-flex !important; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px; }
.bk2-svc-card h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #f0f4f8; }
.bk2-svc-card p { font-size: .83rem; color: #64748b; }

/* FLEET */
.bk2-fleet-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.bk2-fleet-card { background: #111f30; border-radius: 14px; overflow: hidden; border: 1px solid rgba(212,160,23,.12); transition: transform .25s, border-color .25s, box-shadow .25s; }
.bk2-fleet-card:hover { transform: translateY(-6px); border-color: rgba(212,160,23,.35); box-shadow: 0 8px 32px rgba(212,160,23,.1); }
.bk2-fleet-thumb { background: linear-gradient(135deg, #0f1d2e, #1a2d42); padding: 22px 16px 14px; font-size: 3.5rem; text-align: center; line-height: 1; height: 110px; display: flex !important; align-items: center; justify-content: center; }
.bk2-fleet-body { padding: 16px 18px 18px; }
.bk2-fleet-cat { font-size: .66rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #d4a017; margin-bottom: 5px; }
.bk2-fleet-body h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #f0f4f8; }
.bk2-fleet-specs { display: flex !important; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.bk2-spec { font-size: .71rem; color: #64748b; display: flex !important; align-items: center; gap: 3px; }
.bk2-fleet-foot { display: flex !important; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(212,160,23,.12); }
.bk2-price { font-weight: 800; color: #d4a017; font-size: .93rem; }
.bk2-price small { font-size: .7rem; font-weight: 500; color: #64748b; }

/* HOW */
.bk2-steps { display: flex !important; gap: 0; position: relative; justify-content: center; }
.bk2-steps::before { content: ''; position: absolute; top: 33px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg, #d4a017, rgba(212,160,23,.3)); }
.bk2-step { flex: 1; text-align: center; position: relative; z-index: 1; padding: 0 16px; }
.bk2-step-num { width: 66px; height: 66px; border-radius: 50%; background: linear-gradient(135deg, #d4a017, #e8b820); color: #0b1622; display: inline-flex !important; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; margin-bottom: 14px; box-shadow: 0 6px 20px rgba(212,160,23,.3); border: 4px solid #0b1622; }
.bk2-step h4 { font-size: .9rem; font-weight: 700; margin-bottom: 6px; color: #f0f4f8; }
.bk2-step p { font-size: .78rem; color: #64748b; }

/* TESTIMONIALS */
.bk2-testi-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.bk2-testi-card { background: #111f30; border-radius: 14px; padding: 24px 22px; border: 1px solid rgba(212,160,23,.12); }
.bk2-stars { color: #d4a017; font-size: 1rem; margin-bottom: 12px; }
.bk2-testi-text { font-size: .86rem; color: #64748b; margin-bottom: 18px; font-style: italic; }
.bk2-testi-user { display: flex !important; align-items: center; gap: 10px; }
.bk2-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #d4a017, #e8b820); display: inline-flex !important; align-items: center; justify-content: center; font-size: .86rem; color: #0b1622; font-weight: 700; }
.bk2-testi-name { font-weight: 700; font-size: .86rem; color: #f0f4f8; }
.bk2-testi-role { font-size: .74rem; color: #64748b; }

/* CTA */
.bk2-cta { background: linear-gradient(135deg, #d4a017 0%, #e8b820 100%); padding: 72px 0; text-align: center; width: 100%; }
.bk2-cta h2 { font-size: clamp(1.6rem, 3.5vw, 2.5rem); color: #0b1622; margin-bottom: 12px; font-weight: 800; }
.bk2-cta p { font-size: .95rem; color: rgba(11,22,34,.75); max-width: 440px; margin: 0 auto 30px; }
.bk2-btn-cta { background: #0b1622; color: #d4a017 !important; padding: 13px 34px; border-radius: 50px; font-size: .95rem; font-weight: 700; box-shadow: 0 8px 24px rgba(0,0,0,.3); display: inline-block !important; transition: transform .2s, box-shadow .2s; }
.bk2-btn-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,.4); }

/* FOOTER */
.bk2-footer { background: #060f17; padding: 56px 0 28px; width: 100%; }
.bk2-footer-grid { display: grid !important; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 36px; margin-bottom: 40px; }
.bk2-footer-brand h3 { color: #d4a017; font-size: 1.2rem; font-weight: 800; margin-bottom: 10px; }
.bk2-footer-brand p { font-size: .81rem; line-height: 1.7; color: #475569; }
.bk2-footer-col h4 { color: #94a3b8; font-size: .86rem; font-weight: 700; margin-bottom: 14px; }
.bk2-footer-col li { margin-bottom: 8px; }
.bk2-footer-col li a { color: #475569; font-size: .8rem; transition: color .2s; }
.bk2-footer-col li a:hover { color: #d4a017; }
.bk2-footer-bottom { border-top: 1px solid rgba(255,255,255,.05); padding-top: 22px; text-align: center; font-size: .76rem; color: #334155; }

@media (max-width: 900px) {
    .bk2-svc-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk2-fleet-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk2-testi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk2-footer-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 700px) {
    .bk2-hero-inner { flex-direction: column !important; text-align: center; padding: 0 16px; }
    .bk2-hero-image { flex: 0 0 auto !important; width: 100%; max-width: 340px; margin: 0 auto; }
    .bk2-hero-actions { justify-content: center; }
    .bk2-hero-stats { justify-content: center; }
    .bk2-nav-links { display: none !important; }
    .bk2-steps::before { display: none; }
    .bk2-fleet-grid { grid-template-columns: 1fr !important; }
    .bk2-testi-grid { grid-template-columns: 1fr !important; }
    .bk2-footer-grid { grid-template-columns: 1fr !important; }
    .bk2-search-box { flex-direction: column !important; }
    .bk2-field { flex: 0 0 auto !important; width: 100%; }
}
CSS;

        $html = <<<'HTML'
<div class="bk2-wrap">

<nav class="bk2-nav">
  <div class="bk2-nav-inner">
    <span class="bk2-brand">✦ Bintang Kejora</span>
    <ul class="bk2-nav-links">
      <li><a href="#bk2-layanan">Layanan</a></li>
      <li><a href="#bk2-armada">Armada</a></li>
      <li><a href="#bk2-cara">Cara Sewa</a></li>
      <li><a href="#bk2-testimoni">Testimoni</a></li>
    </ul>
    <a href="#bk2-booking" class="bk2-btn-nav">Pesan Sekarang</a>
  </div>
</nav>

<section class="bk2-hero" id="bk2-hero">
  <div class="bk2-container">
    <div class="bk2-hero-inner">
      <div class="bk2-hero-content">
        <div class="bk2-badge"><span class="bk2-badge-dot"></span> Armada Eksekutif Premium</div>
        <h1 class="bk2-hero-title">Pengalaman Berkendara<br><span>Kelas Satu</span> Tanpa Batas</h1>
        <p class="bk2-hero-desc">Armada premium dengan standar kebersihan tertinggi. Sopir terlatih dan berpengalaman siap melayani setiap kebutuhan perjalanan Anda.</p>
        <div class="bk2-hero-actions">
          <a href="#bk2-armada" class="bk2-btn-primary">🚗 Lihat Armada</a>
          <a href="#bk2-cara" class="bk2-btn-outline">Cara Menyewa</a>
        </div>
        <div class="bk2-hero-stats">
          <div><div class="bk2-stat-num">500+</div><div class="bk2-stat-lbl">Unit Armada</div></div>
          <div><div class="bk2-stat-num">12K+</div><div class="bk2-stat-lbl">Pelanggan Puas</div></div>
          <div><div class="bk2-stat-num">50+</div><div class="bk2-stat-lbl">Kota Tersedia</div></div>
        </div>
      </div>
      <div class="bk2-hero-image">
        <div class="bk2-car-card">
          <span class="bk2-car-pill">✦ Unggulan</span>
          <div class="bk2-car-thumb">🚙</div>
          <div class="bk2-car-name">Toyota Innova Reborn</div>
          <div class="bk2-car-sub">7 Penumpang · Otomatis · BBM Diesel</div>
          <div class="bk2-car-footer">
            <div class="bk2-car-price">Rp 650.000 <small>/ hari</small></div>
            <a href="#bk2-booking" class="bk2-btn-book">Pesan</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bk2-search-section" id="bk2-booking">
  <div class="bk2-container">
    <div class="bk2-search-box">
      <div class="bk2-field"><label>Kota Penjemputan</label><select><option>Jakarta</option><option>Surabaya</option><option>Bandung</option><option>Bali</option><option>Yogyakarta</option></select></div>
      <div class="bk2-field"><label>Tanggal Mulai</label><input type="date" /></div>
      <div class="bk2-field"><label>Tanggal Selesai</label><input type="date" /></div>
      <div class="bk2-field"><label>Jenis Kendaraan</label><select><option>Semua Tipe</option><option>MPV</option><option>SUV</option><option>Sedan</option><option>City Car</option></select></div>
      <button class="bk2-btn-search">🔍 Cari Mobil</button>
    </div>
  </div>
</section>

<section class="bk2-section bk2-section-dark" id="bk2-layanan">
  <div class="bk2-container">
    <div class="bk2-sec-head">
      <div class="bk2-sec-label">Layanan Kami</div>
      <h2 class="bk2-sec-title">Solusi Mobilitas Kelas Premium</h2>
      <p class="bk2-sec-sub">Layanan terbaik untuk perjalanan bisnis maupun leisure di seluruh Indonesia.</p>
    </div>
    <div class="bk2-svc-grid">
      <div class="bk2-svc-card"><div class="bk2-svc-icon">🚗</div><h3>Sewa Lepas Kunci</h3><p>Kebebasan penuh tanpa sopir untuk eksplorasi mandiri.</p></div>
      <div class="bk2-svc-card"><div class="bk2-svc-icon">👤</div><h3>Dengan Sopir</h3><p>Sopir profesional siap mengantar Anda ke mana saja.</p></div>
      <div class="bk2-svc-card"><div class="bk2-svc-icon">✈️</div><h3>Antar Jemput Bandara</h3><p>Layanan tepat waktu dari dan ke bandara.</p></div>
      <div class="bk2-svc-card"><div class="bk2-svc-icon">💼</div><h3>Perjalanan Bisnis</h3><p>Armada eksekutif untuk kebutuhan korporat Anda.</p></div>
    </div>
  </div>
</section>

<section class="bk2-section bk2-section-darker" id="bk2-armada">
  <div class="bk2-container">
    <div class="bk2-sec-head">
      <div class="bk2-sec-label">Armada Premium</div>
      <h2 class="bk2-sec-title">Kendaraan Berkualitas Tinggi</h2>
      <p class="bk2-sec-sub">Seluruh armada dirawat dengan standar premium dan siap memberikan kenyamanan terbaik.</p>
    </div>
    <div class="bk2-fleet-grid">
      <div class="bk2-fleet-card"><div class="bk2-fleet-thumb">🚙</div><div class="bk2-fleet-body"><div class="bk2-fleet-cat">MPV Premium</div><h3>Toyota Innova Reborn</h3><div class="bk2-fleet-specs"><span class="bk2-spec">👥 7 Penumpang</span><span class="bk2-spec">⚙️ Otomatis</span><span class="bk2-spec">⛽ Diesel</span></div><div class="bk2-fleet-foot"><div class="bk2-price">Rp 650.000 <small>/ hari</small></div><a href="#bk2-booking" class="bk2-btn-book">Pesan</a></div></div></div>
      <div class="bk2-fleet-card"><div class="bk2-fleet-thumb">🏎️</div><div class="bk2-fleet-body"><div class="bk2-fleet-cat">SUV Mewah</div><h3>Toyota Fortuner</h3><div class="bk2-fleet-specs"><span class="bk2-spec">👥 7 Penumpang</span><span class="bk2-spec">⚙️ Otomatis</span><span class="bk2-spec">⛽ Diesel</span></div><div class="bk2-fleet-foot"><div class="bk2-price">Rp 900.000 <small>/ hari</small></div><a href="#bk2-booking" class="bk2-btn-book">Pesan</a></div></div></div>
      <div class="bk2-fleet-card"><div class="bk2-fleet-thumb">🚗</div><div class="bk2-fleet-body"><div class="bk2-fleet-cat">Sedan Eksekutif</div><h3>Toyota Camry</h3><div class="bk2-fleet-specs"><span class="bk2-spec">👥 5 Penumpang</span><span class="bk2-spec">⚙️ Otomatis</span><span class="bk2-spec">⛽ Bensin</span></div><div class="bk2-fleet-foot"><div class="bk2-price">Rp 1.200.000 <small>/ hari</small></div><a href="#bk2-booking" class="bk2-btn-book">Pesan</a></div></div></div>
      <div class="bk2-fleet-card"><div class="bk2-fleet-thumb">🚐</div><div class="bk2-fleet-body"><div class="bk2-fleet-cat">MPV Family</div><h3>Toyota Avanza</h3><div class="bk2-fleet-specs"><span class="bk2-spec">👥 7 Penumpang</span><span class="bk2-spec">⚙️ Manual</span><span class="bk2-spec">⛽ Bensin</span></div><div class="bk2-fleet-foot"><div class="bk2-price">Rp 380.000 <small>/ hari</small></div><a href="#bk2-booking" class="bk2-btn-book">Pesan</a></div></div></div>
      <div class="bk2-fleet-card"><div class="bk2-fleet-thumb">🚌</div><div class="bk2-fleet-body"><div class="bk2-fleet-cat">Minibus</div><h3>Toyota HiAce</h3><div class="bk2-fleet-specs"><span class="bk2-spec">👥 14 Penumpang</span><span class="bk2-spec">⚙️ Manual</span><span class="bk2-spec">⛽ Diesel</span></div><div class="bk2-fleet-foot"><div class="bk2-price">Rp 1.100.000 <small>/ hari</small></div><a href="#bk2-booking" class="bk2-btn-book">Pesan</a></div></div></div>
      <div class="bk2-fleet-card"><div class="bk2-fleet-thumb">🚕</div><div class="bk2-fleet-body"><div class="bk2-fleet-cat">City Car</div><h3>Honda Brio</h3><div class="bk2-fleet-specs"><span class="bk2-spec">👥 4 Penumpang</span><span class="bk2-spec">⚙️ Otomatis</span><span class="bk2-spec">⛽ Bensin</span></div><div class="bk2-fleet-foot"><div class="bk2-price">Rp 280.000 <small>/ hari</small></div><a href="#bk2-booking" class="bk2-btn-book">Pesan</a></div></div></div>
    </div>
  </div>
</section>

<section class="bk2-section bk2-section-mid" id="bk2-cara">
  <div class="bk2-container">
    <div class="bk2-sec-head">
      <div class="bk2-sec-label">Cara Menyewa</div>
      <h2 class="bk2-sec-title">Mudah, Cepat, Terpercaya</h2>
      <p class="bk2-sec-sub">4 langkah sederhana untuk mendapatkan kendaraan impian Anda.</p>
    </div>
    <div class="bk2-steps">
      <div class="bk2-step"><div class="bk2-step-num">1</div><h4>Pilih Kendaraan</h4><p>Telusuri katalog dan pilih armada sesuai kebutuhan.</p></div>
      <div class="bk2-step"><div class="bk2-step-num">2</div><h4>Isi Formulir</h4><p>Lengkapi data diri dan detail perjalanan Anda.</p></div>
      <div class="bk2-step"><div class="bk2-step-num">3</div><h4>Konfirmasi &amp; Bayar</h4><p>Pilih metode pembayaran dan konfirmasi pesanan.</p></div>
      <div class="bk2-step"><div class="bk2-step-num">4</div><h4>Mulai Perjalanan</h4><p>Kendaraan siap mengantar Anda ke tujuan.</p></div>
    </div>
  </div>
</section>

<section class="bk2-section bk2-section-dark" id="bk2-testimoni">
  <div class="bk2-container">
    <div class="bk2-sec-head">
      <div class="bk2-sec-label">Testimoni</div>
      <h2 class="bk2-sec-title">Kata Mereka Tentang Kami</h2>
    </div>
    <div class="bk2-testi-grid">
      <div class="bk2-testi-card"><div class="bk2-stars">★★★★★</div><p class="bk2-testi-text">"Pelayanan premium, mobil bersih dan sopir sangat profesional. Sangat merekomendasikan!"</p><div class="bk2-testi-user"><div class="bk2-avatar">AR</div><div><div class="bk2-testi-name">Andi Rahmanto</div><div class="bk2-testi-role">Pelanggan · Jakarta</div></div></div></div>
      <div class="bk2-testi-card"><div class="bk2-stars">★★★★★</div><p class="bk2-testi-text">"Fortuner yang kami sewa sangat terawat, sempurna untuk perjalanan keluarga kami ke Bali."</p><div class="bk2-testi-user"><div class="bk2-avatar">SP</div><div><div class="bk2-testi-name">Sari Permata</div><div class="bk2-testi-role">Pelanggan · Surabaya</div></div></div></div>
      <div class="bk2-testi-card"><div class="bk2-stars">★★★★★</div><p class="bk2-testi-text">"Layanan antar jemput bandara tepat waktu dan sopirnya sangat membantu. Recommended!"</p><div class="bk2-testi-user"><div class="bk2-avatar">BW</div><div><div class="bk2-testi-name">Bagus Wicaksono</div><div class="bk2-testi-role">Pelanggan · Yogyakarta</div></div></div></div>
    </div>
  </div>
</section>

<section class="bk2-cta">
  <div class="bk2-container">
    <h2>Rasakan Pengalaman Berkendara Premium</h2>
    <p>Pesan sekarang dan nikmati layanan terbaik kami. Kepuasan Anda adalah prioritas utama kami.</p>
    <a href="#bk2-booking" class="bk2-btn-cta">✦ Pesan Sekarang</a>
  </div>
</section>

<footer class="bk2-footer">
  <div class="bk2-container">
    <div class="bk2-footer-grid">
      <div class="bk2-footer-brand"><h3>✦ Bintang Kejora</h3><p>Rental mobil premium terpercaya. Armada lengkap, layanan profesional, harga terjangkau.</p></div>
      <div class="bk2-footer-col"><h4>Layanan</h4><ul><li><a href="#">Sewa Lepas Kunci</a></li><li><a href="#">Dengan Sopir</a></li><li><a href="#">Antar Jemput Bandara</a></li><li><a href="#">Perjalanan Bisnis</a></li></ul></div>
      <div class="bk2-footer-col"><h4>Armada</h4><ul><li><a href="#">MPV &amp; Minibus</a></li><li><a href="#">SUV Premium</a></li><li><a href="#">Sedan Eksekutif</a></li><li><a href="#">City Car</a></li></ul></div>
      <div class="bk2-footer-col"><h4>Kontak</h4><ul><li><a href="#">📞 +62 812-3456-7890</a></li><li><a href="#">📧 info@bintangkejora.id</a></li><li><a href="#">📍 Jakarta, Indonesia</a></li><li><a href="#">💬 WhatsApp</a></li></ul></div>
    </div>
    <div class="bk2-footer-bottom">© 2025 Bintang Kejora. Seluruh hak cipta dilindungi.</div>
  </div>
</footer>

</div>
HTML;

        Page::create([
            'user_id' => $userId,
            'title' => '[Template 2] Bintang Kejora – Elegan Gelap',
            'slug' => 'landing-premium-dark',
            'html' => $html,
            'css' => $css,
            'gjs_data' => null,
            'is_published' => true,
            'is_homepage' => false,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Template 3: Hangat Tropis (Teal + Coral/Orange)
    // ─────────────────────────────────────────────────────────────────────
    private function createWarmTropical(int $userId): void
    {
        if (Page::where('slug', 'landing-warm-tropical')->exists()) {
            return;
        }

        $css = <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.bk3-wrap, .bk3-wrap > * {
    display: block !important;
    flex-direction: unset !important;
    flex-grow: unset !important;
    flex-shrink: unset !important;
    min-width: unset !important;
}
.bk3-wrap *, .bk3-wrap *::before, .bk3-wrap *::after { box-sizing: border-box; }
.bk3-wrap { font-family: 'Plus Jakarta Sans', sans-serif; color: #1c3035; background: #f0faf9; line-height: 1.6; width: 100%; }
.bk3-wrap h1,.bk3-wrap h2,.bk3-wrap h3,.bk3-wrap h4 { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 0; }
.bk3-wrap p { margin: 0; padding: 0; }
.bk3-wrap a { text-decoration: none; }
.bk3-wrap ul { list-style: none; margin: 0; padding: 0; }

.bk3-container { width: 100%; max-width: 1140px; margin-left: auto; margin-right: auto; padding-left: 24px; padding-right: 24px; }

/* NAVBAR */
.bk3-nav { display: flex !important; align-items: center; position: sticky; top: 0; z-index: 200; background: rgba(240,250,249,.95); backdrop-filter: blur(14px); border-bottom: 1px solid #b2dfdb; height: 68px; width: 100%; }
.bk3-nav-inner { display: flex !important; align-items: center; justify-content: space-between; width: 100%; max-width: 1140px; margin: 0 auto; padding: 0 24px; }
.bk3-brand { font-size: 1.3rem; font-weight: 800; color: #0f766e; display: flex !important; align-items: center; gap: 6px; }
.bk3-brand-accent { color: #f97316; }
.bk3-nav-links { display: flex !important; gap: 28px; align-items: center; }
.bk3-nav-links a { font-size: .88rem; font-weight: 500; color: #4d7c77; transition: color .2s; }
.bk3-nav-links a:hover { color: #0f766e; }
.bk3-btn-nav { background: #0f766e; color: #fff !important; padding: 9px 22px; border-radius: 50px; font-size: .86rem; font-weight: 700; transition: background .2s, transform .15s; white-space: nowrap; }
.bk3-btn-nav:hover { background: #0d9488; transform: translateY(-1px); }

/* HERO */
.bk3-hero { background: linear-gradient(135deg, #ccfbf1 0%, #f0faf9 50%, #fff7ed 100%); padding: 88px 0 72px; position: relative; overflow: hidden; width: 100%; }
.bk3-hero::before { content: ''; position: absolute; top: -60px; right: -60px; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, rgba(249,115,22,.06) 0%, transparent 65%); pointer-events: none; }
.bk3-hero-inner { display: flex !important; align-items: center; gap: 52px; }
.bk3-hero-content { flex: 1; min-width: 0; }
.bk3-hero-image { flex: 0 0 400px; }
.bk3-badge { display: inline-flex !important; align-items: center; gap: 8px; background: rgba(15,118,110,.1); color: #0f766e; padding: 6px 16px; border-radius: 50px; font-size: .72rem; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 22px; }
.bk3-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #f97316; display: inline-block !important; }
.bk3-hero-title { font-size: clamp(1.9rem, 3.8vw, 3.1rem); font-weight: 800; color: #1c3035; line-height: 1.15; margin-bottom: 18px; }
.bk3-hero-title span { color: #f97316; }
.bk3-hero-desc { font-size: 1rem; color: #4d7c77; margin-bottom: 34px; max-width: 460px; }
.bk3-hero-actions { display: flex !important; gap: 14px; flex-wrap: wrap; margin-bottom: 44px; }
.bk3-btn-primary { background: #f97316; color: #fff !important; padding: 13px 28px; border-radius: 50px; font-size: .95rem; font-weight: 700; display: inline-flex !important; align-items: center; gap: 8px; box-shadow: 0 6px 20px rgba(249,115,22,.28); transition: background .2s, transform .15s; }
.bk3-btn-primary:hover { background: #ea6c0a; transform: translateY(-2px); }
.bk3-btn-outline { background: transparent; color: #0f766e !important; padding: 13px 28px; border-radius: 50px; font-size: .95rem; font-weight: 600; border: 2px solid #0f766e; transition: background .2s, color .2s; }
.bk3-btn-outline:hover { background: #0f766e; color: #fff !important; }
.bk3-hero-stats { display: flex !important; gap: 32px; flex-wrap: wrap; }
.bk3-stat-num { font-size: 1.7rem; font-weight: 800; color: #0f766e; }
.bk3-stat-lbl { font-size: .76rem; color: #4d7c77; font-weight: 500; }
.bk3-car-card { background: #fff; border-radius: 22px; padding: 26px; box-shadow: 0 20px 60px rgba(15,118,110,.14); position: relative; width: 100%; border: 1px solid #b2dfdb; }
.bk3-car-pill { position: absolute; top: 16px; left: 16px; background: #f97316; color: #fff; font-size: .7rem; font-weight: 700; padding: 3px 12px; border-radius: 50px; }
.bk3-car-thumb { background: linear-gradient(135deg, #ccfbf1, #b2dfdb); border-radius: 14px; padding: 22px; font-size: 4.5rem; text-align: center; line-height: 1; }
.bk3-car-name { font-size: 1.05rem; font-weight: 700; margin: 14px 0 4px; color: #1c3035; }
.bk3-car-sub { font-size: .78rem; color: #4d7c77; }
.bk3-car-footer { display: flex !important; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px solid #b2dfdb; }
.bk3-car-price { font-size: 1.1rem; font-weight: 800; color: #0f766e; }
.bk3-car-price small { font-size: .72rem; font-weight: 500; color: #4d7c77; }
.bk3-btn-book { background: #0f766e; color: #fff !important; padding: 8px 18px; border-radius: 8px; font-size: .8rem; font-weight: 700; transition: background .2s; }
.bk3-btn-book:hover { background: #0d9488; }

/* SEARCH */
.bk3-search-section { background: #f0faf9; padding: 0 0 24px; width: 100%; }
.bk3-search-box { background: #fff; border-radius: 14px; box-shadow: 0 8px 32px rgba(15,118,110,.12); border: 1px solid #b2dfdb; padding: 22px 26px; display: flex !important; gap: 14px; align-items: flex-end; flex-wrap: wrap; margin-top: -36px; position: relative; z-index: 10; }
.bk3-field { flex: 1 1 140px; min-width: 0; }
.bk3-field label { display: block; font-size: .7rem; font-weight: 700; color: #4d7c77; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.bk3-field input, .bk3-field select { width: 100%; padding: 9px 12px; border: 1.5px solid #b2dfdb; border-radius: 9px; font-size: .88rem; font-family: inherit; color: #1c3035; background: #f0faf9; outline: none; transition: border-color .2s; appearance: auto; }
.bk3-field input:focus, .bk3-field select:focus { border-color: #0f766e; }
.bk3-btn-search { background: #f97316; color: #fff; padding: 10px 24px; border-radius: 9px; font-size: .9rem; font-weight: 700; border: none; cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0; transition: background .2s; }
.bk3-btn-search:hover { background: #ea6c0a; }

/* SECTIONS */
.bk3-section { padding: 72px 0; width: 100%; }
.bk3-section-light { background: #f0faf9; }
.bk3-section-white { background: #ffffff; }
.bk3-section-warm { background: linear-gradient(135deg, #fff7ed, #fef3c7); }
.bk3-sec-head { text-align: center; margin-bottom: 52px; }
.bk3-sec-label { font-size: .72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #0f766e; margin-bottom: 10px; }
.bk3-sec-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #1c3035; }
.bk3-sec-sub { color: #4d7c77; margin-top: 10px; font-size: .93rem; max-width: 500px; margin-left: auto !important; margin-right: auto !important; text-align: center !important; display: block !important; }

/* SERVICE CARDS */
.bk3-svc-grid { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 22px; }
.bk3-svc-card { background: #fff; border-radius: 14px; padding: 28px 22px; border: 1px solid #b2dfdb; text-align: center; transition: transform .25s, box-shadow .25s; }
.bk3-svc-card:hover { transform: translateY(-6px); box-shadow: 0 8px 32px rgba(15,118,110,.12); }
.bk3-svc-icon { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #0f766e, #0d9488); display: inline-flex !important; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px; }
.bk3-svc-card h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #1c3035; }
.bk3-svc-card p { font-size: .83rem; color: #4d7c77; }

/* FLEET */
.bk3-fleet-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.bk3-fleet-card { background: #f0faf9; border-radius: 14px; overflow: hidden; border: 1px solid #b2dfdb; transition: transform .25s, box-shadow .25s; }
.bk3-fleet-card:hover { transform: translateY(-6px); box-shadow: 0 8px 32px rgba(15,118,110,.12); }
.bk3-fleet-thumb { background: linear-gradient(135deg, #ccfbf1, #b2dfdb); padding: 22px 16px 14px; font-size: 3.5rem; text-align: center; line-height: 1; height: 110px; display: flex !important; align-items: center; justify-content: center; }
.bk3-fleet-body { padding: 16px 18px 18px; }
.bk3-fleet-cat { font-size: .66rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #0f766e; margin-bottom: 5px; }
.bk3-fleet-body h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #1c3035; }
.bk3-fleet-specs { display: flex !important; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.bk3-spec { font-size: .71rem; color: #4d7c77; display: flex !important; align-items: center; gap: 3px; }
.bk3-fleet-foot { display: flex !important; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #b2dfdb; }
.bk3-price { font-weight: 800; color: #0f766e; font-size: .93rem; }
.bk3-price small { font-size: .7rem; font-weight: 500; color: #4d7c77; }

/* HOW */
.bk3-steps { display: flex !important; gap: 0; position: relative; justify-content: center; }
.bk3-steps::before { content: ''; position: absolute; top: 33px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg, #0f766e, #f97316); }
.bk3-step { flex: 1; text-align: center; position: relative; z-index: 1; padding: 0 16px; }
.bk3-step-num { width: 66px; height: 66px; border-radius: 50%; background: linear-gradient(135deg, #0f766e, #0d9488); color: #fff; display: inline-flex !important; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; margin-bottom: 14px; box-shadow: 0 6px 20px rgba(15,118,110,.28); border: 4px solid #f0faf9; }
.bk3-step h4 { font-size: .9rem; font-weight: 700; margin-bottom: 6px; color: #1c3035; }
.bk3-step p { font-size: .78rem; color: #4d7c77; }

/* TESTIMONIALS */
.bk3-testi-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 22px; }
.bk3-testi-card { background: #fff; border-radius: 14px; padding: 24px 22px; border: 1px solid #b2dfdb; }
.bk3-stars { color: #f97316; font-size: 1rem; margin-bottom: 12px; }
.bk3-testi-text { font-size: .86rem; color: #4d7c77; margin-bottom: 18px; font-style: italic; }
.bk3-testi-user { display: flex !important; align-items: center; gap: 10px; }
.bk3-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #0f766e, #0d9488); display: inline-flex !important; align-items: center; justify-content: center; font-size: .86rem; color: #fff; font-weight: 700; }
.bk3-testi-name { font-weight: 700; font-size: .86rem; color: #1c3035; }
.bk3-testi-role { font-size: .74rem; color: #4d7c77; }

/* CTA */
.bk3-cta { background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 72px 0; text-align: center; width: 100%; }
.bk3-cta h2 { font-size: clamp(1.6rem, 3.5vw, 2.5rem); color: #fff; margin-bottom: 12px; font-weight: 800; }
.bk3-cta p { font-size: .95rem; color: rgba(255,255,255,.85); max-width: 440px; margin: 0 auto 30px; }
.bk3-btn-cta { background: #f97316; color: #fff !important; padding: 13px 34px; border-radius: 50px; font-size: .95rem; font-weight: 700; box-shadow: 0 8px 24px rgba(249,115,22,.3); display: inline-block !important; transition: transform .2s; }
.bk3-btn-cta:hover { background: #ea6c0a; transform: translateY(-2px); }

/* FOOTER */
.bk3-footer { background: #0d2824; padding: 56px 0 28px; width: 100%; }
.bk3-footer-grid { display: grid !important; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 36px; margin-bottom: 40px; }
.bk3-footer-brand h3 { color: #5eead4; font-size: 1.2rem; font-weight: 800; margin-bottom: 10px; }
.bk3-footer-brand span { color: #f97316; }
.bk3-footer-brand p { font-size: .81rem; line-height: 1.7; color: #4d7c77; }
.bk3-footer-col h4 { color: #5eead4; font-size: .86rem; font-weight: 700; margin-bottom: 14px; }
.bk3-footer-col li { margin-bottom: 8px; }
.bk3-footer-col li a { color: #4d7c77; font-size: .8rem; transition: color .2s; }
.bk3-footer-col li a:hover { color: #5eead4; }
.bk3-footer-bottom { border-top: 1px solid rgba(255,255,255,.06); padding-top: 22px; text-align: center; font-size: .76rem; color: #2d5c55; }

@media (max-width: 900px) {
    .bk3-svc-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk3-fleet-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk3-testi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk3-footer-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 700px) {
    .bk3-hero-inner { flex-direction: column !important; text-align: center; padding: 0 16px; }
    .bk3-hero-image { flex: 0 0 auto !important; width: 100%; max-width: 340px; margin: 0 auto; }
    .bk3-hero-actions { justify-content: center; }
    .bk3-hero-stats { justify-content: center; }
    .bk3-nav-links { display: none !important; }
    .bk3-steps::before { display: none; }
    .bk3-fleet-grid { grid-template-columns: 1fr !important; }
    .bk3-testi-grid { grid-template-columns: 1fr !important; }
    .bk3-footer-grid { grid-template-columns: 1fr !important; }
    .bk3-search-box { flex-direction: column !important; }
    .bk3-field { flex: 0 0 auto !important; width: 100%; }
}
CSS;

        $html = <<<'HTML'
<div class="bk3-wrap">

<nav class="bk3-nav">
  <div class="bk3-nav-inner">
    <span class="bk3-brand">🌟 Bintang <span class="bk3-brand-accent">Kejora</span></span>
    <ul class="bk3-nav-links">
      <li><a href="#bk3-layanan">Layanan</a></li>
      <li><a href="#bk3-armada">Armada</a></li>
      <li><a href="#bk3-cara">Cara Sewa</a></li>
      <li><a href="#bk3-testimoni">Testimoni</a></li>
    </ul>
    <a href="#bk3-booking" class="bk3-btn-nav">Pesan Sekarang</a>
  </div>
</nav>

<section class="bk3-hero" id="bk3-hero">
  <div class="bk3-container">
    <div class="bk3-hero-inner">
      <div class="bk3-hero-content">
        <div class="bk3-badge"><span class="bk3-badge-dot"></span> Perjalanan Menyenangkan</div>
        <h1 class="bk3-hero-title">Bepergian Bersama<br>Keluarga Jadi <span>Lebih Seru!</span></h1>
        <p class="bk3-hero-desc">Armada lengkap, harga ramah di kantong, dan pelayanan hangat untuk setiap perjalanan keluarga maupun petualangan solo Anda.</p>
        <div class="bk3-hero-actions">
          <a href="#bk3-armada" class="bk3-btn-primary">🚗 Pilih Mobilmu</a>
          <a href="#bk3-cara" class="bk3-btn-outline">Cara Menyewa</a>
        </div>
        <div class="bk3-hero-stats">
          <div><div class="bk3-stat-num">500+</div><div class="bk3-stat-lbl">Unit Armada</div></div>
          <div><div class="bk3-stat-num">12K+</div><div class="bk3-stat-lbl">Pelanggan Puas</div></div>
          <div><div class="bk3-stat-num">50+</div><div class="bk3-stat-lbl">Kota Tersedia</div></div>
        </div>
      </div>
      <div class="bk3-hero-image">
        <div class="bk3-car-card">
          <span class="bk3-car-pill">🔥 Favorit Keluarga</span>
          <div class="bk3-car-thumb">🚙</div>
          <div class="bk3-car-name">Toyota Innova Reborn</div>
          <div class="bk3-car-sub">7 Penumpang · Otomatis · BBM Diesel</div>
          <div class="bk3-car-footer">
            <div class="bk3-car-price">Rp 650.000 <small>/ hari</small></div>
            <a href="#bk3-booking" class="bk3-btn-book">Pesan</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bk3-search-section" id="bk3-booking">
  <div class="bk3-container">
    <div class="bk3-search-box">
      <div class="bk3-field"><label>Kota Penjemputan</label><select><option>Jakarta</option><option>Surabaya</option><option>Bandung</option><option>Bali</option><option>Yogyakarta</option></select></div>
      <div class="bk3-field"><label>Tanggal Mulai</label><input type="date" /></div>
      <div class="bk3-field"><label>Tanggal Selesai</label><input type="date" /></div>
      <div class="bk3-field"><label>Jenis Kendaraan</label><select><option>Semua Tipe</option><option>MPV</option><option>SUV</option><option>Sedan</option><option>City Car</option></select></div>
      <button class="bk3-btn-search">🔍 Cari Mobil</button>
    </div>
  </div>
</section>

<section class="bk3-section bk3-section-light" id="bk3-layanan">
  <div class="bk3-container">
    <div class="bk3-sec-head">
      <div class="bk3-sec-label">Layanan Kami</div>
      <h2 class="bk3-sec-title">Semua Kebutuhan Perjalananmu</h2>
      <p class="bk3-sec-sub">Dari liburan keluarga sampai perjalanan bisnis, kami punya solusinya.</p>
    </div>
    <div class="bk3-svc-grid">
      <div class="bk3-svc-card"><div class="bk3-svc-icon">🚗</div><h3>Sewa Lepas Kunci</h3><p>Kebebasan penuh, jelajahi destinasi favoritmu sendiri.</p></div>
      <div class="bk3-svc-card"><div class="bk3-svc-icon">👤</div><h3>Dengan Sopir</h3><p>Sopir ramah dan berpengalaman siap menemani perjalananmu.</p></div>
      <div class="bk3-svc-card"><div class="bk3-svc-icon">✈️</div><h3>Antar Jemput Bandara</h3><p>Tepat waktu, nyaman, dan bebas stress dari bandara.</p></div>
      <div class="bk3-svc-card"><div class="bk3-svc-icon">🏖️</div><h3>Paket Wisata</h3><p>Nikmati paket wisata seru dengan armada nyaman pilihan kami.</p></div>
    </div>
  </div>
</section>

<section class="bk3-section bk3-section-white" id="bk3-armada">
  <div class="bk3-container">
    <div class="bk3-sec-head">
      <div class="bk3-sec-label">Pilih Armada</div>
      <h2 class="bk3-sec-title">Mobil Terbaik Untuk Perjalananmu</h2>
      <p class="bk3-sec-sub">Seluruh armada terawat rapi dan siap memberikan kenyamanan perjalanan terbaik.</p>
    </div>
    <div class="bk3-fleet-grid">
      <div class="bk3-fleet-card"><div class="bk3-fleet-thumb">🚙</div><div class="bk3-fleet-body"><div class="bk3-fleet-cat">MPV Premium</div><h3>Toyota Innova Reborn</h3><div class="bk3-fleet-specs"><span class="bk3-spec">👥 7 Penumpang</span><span class="bk3-spec">⚙️ Otomatis</span><span class="bk3-spec">⛽ Diesel</span></div><div class="bk3-fleet-foot"><div class="bk3-price">Rp 650.000 <small>/ hari</small></div><a href="#bk3-booking" class="bk3-btn-book">Pesan</a></div></div></div>
      <div class="bk3-fleet-card"><div class="bk3-fleet-thumb">🏎️</div><div class="bk3-fleet-body"><div class="bk3-fleet-cat">SUV Tangguh</div><h3>Toyota Fortuner</h3><div class="bk3-fleet-specs"><span class="bk3-spec">👥 7 Penumpang</span><span class="bk3-spec">⚙️ Otomatis</span><span class="bk3-spec">⛽ Diesel</span></div><div class="bk3-fleet-foot"><div class="bk3-price">Rp 900.000 <small>/ hari</small></div><a href="#bk3-booking" class="bk3-btn-book">Pesan</a></div></div></div>
      <div class="bk3-fleet-card"><div class="bk3-fleet-thumb">🚐</div><div class="bk3-fleet-body"><div class="bk3-fleet-cat">MPV Keluarga</div><h3>Toyota Avanza</h3><div class="bk3-fleet-specs"><span class="bk3-spec">👥 7 Penumpang</span><span class="bk3-spec">⚙️ Manual</span><span class="bk3-spec">⛽ Bensin</span></div><div class="bk3-fleet-foot"><div class="bk3-price">Rp 380.000 <small>/ hari</small></div><a href="#bk3-booking" class="bk3-btn-book">Pesan</a></div></div></div>
      <div class="bk3-fleet-card"><div class="bk3-fleet-thumb">🚕</div><div class="bk3-fleet-body"><div class="bk3-fleet-cat">City Car</div><h3>Honda Brio</h3><div class="bk3-fleet-specs"><span class="bk3-spec">👥 4 Penumpang</span><span class="bk3-spec">⚙️ Otomatis</span><span class="bk3-spec">⛽ Bensin</span></div><div class="bk3-fleet-foot"><div class="bk3-price">Rp 280.000 <small>/ hari</small></div><a href="#bk3-booking" class="bk3-btn-book">Pesan</a></div></div></div>
      <div class="bk3-fleet-card"><div class="bk3-fleet-thumb">🚌</div><div class="bk3-fleet-body"><div class="bk3-fleet-cat">Minibus Rombongan</div><h3>Toyota HiAce</h3><div class="bk3-fleet-specs"><span class="bk3-spec">👥 14 Penumpang</span><span class="bk3-spec">⚙️ Manual</span><span class="bk3-spec">⛽ Diesel</span></div><div class="bk3-fleet-foot"><div class="bk3-price">Rp 1.100.000 <small>/ hari</small></div><a href="#bk3-booking" class="bk3-btn-book">Pesan</a></div></div></div>
      <div class="bk3-fleet-card"><div class="bk3-fleet-thumb">🚗</div><div class="bk3-fleet-body"><div class="bk3-fleet-cat">Sedan</div><h3>Toyota Camry</h3><div class="bk3-fleet-specs"><span class="bk3-spec">👥 5 Penumpang</span><span class="bk3-spec">⚙️ Otomatis</span><span class="bk3-spec">⛽ Bensin</span></div><div class="bk3-fleet-foot"><div class="bk3-price">Rp 1.200.000 <small>/ hari</small></div><a href="#bk3-booking" class="bk3-btn-book">Pesan</a></div></div></div>
    </div>
  </div>
</section>

<section class="bk3-section bk3-section-warm" id="bk3-cara">
  <div class="bk3-container">
    <div class="bk3-sec-head">
      <div class="bk3-sec-label">Cara Menyewa</div>
      <h2 class="bk3-sec-title">Gampang Banget, Cuma 4 Langkah!</h2>
      <p class="bk3-sec-sub">Proses pemesanan cepat dan mudah, perjalananmu sudah bisa dimulai.</p>
    </div>
    <div class="bk3-steps">
      <div class="bk3-step"><div class="bk3-step-num">1</div><h4>Pilih Mobil</h4><p>Telusuri dan pilih kendaraan yang sesuai kebutuhanmu.</p></div>
      <div class="bk3-step"><div class="bk3-step-num">2</div><h4>Isi Data</h4><p>Lengkapi data diri dan detail perjalananmu.</p></div>
      <div class="bk3-step"><div class="bk3-step-num">3</div><h4>Bayar</h4><p>Pilih metode pembayaran favoritmu dan konfirmasi.</p></div>
      <div class="bk3-step"><div class="bk3-step-num">4</div><h4>Jalan!</h4><p>Kendaraan siap, saatnya menikmati perjalanan seru!</p></div>
    </div>
  </div>
</section>

<section class="bk3-section bk3-section-white" id="bk3-testimoni">
  <div class="bk3-container">
    <div class="bk3-sec-head">
      <div class="bk3-sec-label">Testimoni</div>
      <h2 class="bk3-sec-title">Yang Mereka Rasakan 🌟</h2>
    </div>
    <div class="bk3-testi-grid">
      <div class="bk3-testi-card"><div class="bk3-stars">★★★★★</div><p class="bk3-testi-text">"Mobilnya bersih banget dan AC-nya dingin. Sopirnya juga ramah dan tepat waktu. Pasti sewa lagi!"</p><div class="bk3-testi-user"><div class="bk3-avatar">AR</div><div><div class="bk3-testi-name">Andi Rahmanto</div><div class="bk3-testi-role">Pelanggan · Jakarta</div></div></div></div>
      <div class="bk3-testi-card"><div class="bk3-stars">★★★★★</div><p class="bk3-testi-text">"Liburan keluarga ke Bali makin seru dengan Fortuner dari Bintang Kejora. Mantap!"</p><div class="bk3-testi-user"><div class="bk3-avatar">SP</div><div><div class="bk3-testi-name">Sari Permata</div><div class="bk3-testi-role">Pelanggan · Surabaya</div></div></div></div>
      <div class="bk3-testi-card"><div class="bk3-stars">★★★★☆</div><p class="bk3-testi-text">"Antar jemput bandara tepat waktu, gak perlu kuatir kesiangan lagi. Terima kasih!"</p><div class="bk3-testi-user"><div class="bk3-avatar">BW</div><div><div class="bk3-testi-name">Bagus Wicaksono</div><div class="bk3-testi-role">Pelanggan · Yogyakarta</div></div></div></div>
    </div>
  </div>
</section>

<section class="bk3-cta">
  <div class="bk3-container">
    <h2>Yuk, Mulai Petualanganmu! 🚗</h2>
    <p>Pesan sekarang dan dapatkan pengalaman berkendara yang menyenangkan bersama Bintang Kejora.</p>
    <a href="#bk3-booking" class="bk3-btn-cta">🚀 Pesan Sekarang</a>
  </div>
</section>

<footer class="bk3-footer">
  <div class="bk3-container">
    <div class="bk3-footer-grid">
      <div class="bk3-footer-brand"><h3>🌟 Bintang <span>Kejora</span></h3><p>Rental mobil terpercaya untuk setiap petualangan. Armada lengkap, harga bersahabat.</p></div>
      <div class="bk3-footer-col"><h4>Layanan</h4><ul><li><a href="#">Sewa Lepas Kunci</a></li><li><a href="#">Dengan Sopir</a></li><li><a href="#">Antar Jemput Bandara</a></li><li><a href="#">Paket Wisata</a></li></ul></div>
      <div class="bk3-footer-col"><h4>Armada</h4><ul><li><a href="#">MPV &amp; Minibus</a></li><li><a href="#">SUV</a></li><li><a href="#">Sedan</a></li><li><a href="#">City Car</a></li></ul></div>
      <div class="bk3-footer-col"><h4>Kontak</h4><ul><li><a href="#">📞 +62 812-3456-7890</a></li><li><a href="#">📧 info@bintangkejora.id</a></li><li><a href="#">📍 Jakarta, Indonesia</a></li><li><a href="#">💬 WhatsApp</a></li></ul></div>
    </div>
    <div class="bk3-footer-bottom">© 2025 Bintang Kejora. Seluruh hak cipta dilindungi.</div>
  </div>
</footer>

</div>
HTML;

        Page::create([
            'user_id' => $userId,
            'title' => '[Template 3] Bintang Kejora – Hangat Tropis',
            'slug' => 'landing-warm-tropical',
            'html' => $html,
            'css' => $css,
            'gjs_data' => null,
            'is_published' => true,
            'is_homepage' => false,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Template 4: Bersih Modern (Indigo + Mint)
    // ─────────────────────────────────────────────────────────────────────
    private function createCleanMinimal(int $userId): void
    {
        if (Page::where('slug', 'landing-clean-minimal')->exists()) {
            return;
        }

        $css = <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.bk4-wrap, .bk4-wrap > * {
    display: block !important;
    flex-direction: unset !important;
    flex-grow: unset !important;
    flex-shrink: unset !important;
    min-width: unset !important;
}
.bk4-wrap *, .bk4-wrap *::before, .bk4-wrap *::after { box-sizing: border-box; }
.bk4-wrap { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e1b4b; background: #fafaf9; line-height: 1.6; width: 100%; }
.bk4-wrap h1,.bk4-wrap h2,.bk4-wrap h3,.bk4-wrap h4 { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 0; }
.bk4-wrap p { margin: 0; padding: 0; }
.bk4-wrap a { text-decoration: none; }
.bk4-wrap ul { list-style: none; margin: 0; padding: 0; }

.bk4-container { width: 100%; max-width: 1140px; margin-left: auto; margin-right: auto; padding-left: 24px; padding-right: 24px; }

/* NAVBAR */
.bk4-nav { display: flex !important; align-items: center; position: sticky; top: 0; z-index: 200; background: rgba(250,250,249,.95); backdrop-filter: blur(14px); border-bottom: 1px solid #e0e7ff; height: 68px; width: 100%; }
.bk4-nav-inner { display: flex !important; align-items: center; justify-content: space-between; width: 100%; max-width: 1140px; margin: 0 auto; padding: 0 24px; }
.bk4-brand { font-size: 1.3rem; font-weight: 800; color: #4f46e5; display: flex !important; align-items: center; gap: 6px; }
.bk4-brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block !important; }
.bk4-nav-links { display: flex !important; gap: 28px; align-items: center; }
.bk4-nav-links a { font-size: .88rem; font-weight: 500; color: #6b7280; transition: color .2s; }
.bk4-nav-links a:hover { color: #4f46e5; }
.bk4-btn-nav { background: #4f46e5; color: #fff !important; padding: 9px 22px; border-radius: 8px; font-size: .86rem; font-weight: 700; transition: background .2s, transform .15s; white-space: nowrap; }
.bk4-btn-nav:hover { background: #4338ca; transform: translateY(-1px); }

/* HERO */
.bk4-hero { background: #fafaf9; padding: 88px 0 72px; position: relative; overflow: hidden; width: 100%; border-bottom: 1px solid #e0e7ff; }
.bk4-hero-inner { display: flex !important; align-items: center; gap: 52px; }
.bk4-hero-content { flex: 1; min-width: 0; }
.bk4-hero-image { flex: 0 0 400px; }
.bk4-badge { display: inline-flex !important; align-items: center; gap: 8px; background: #ede9fe; color: #4f46e5; padding: 6px 16px; border-radius: 8px; font-size: .72rem; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 22px; border: 1px solid #c4b5fd; }
.bk4-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block !important; }
.bk4-hero-title { font-size: clamp(1.9rem, 3.8vw, 3.1rem); font-weight: 800; color: #1e1b4b; line-height: 1.15; margin-bottom: 18px; }
.bk4-hero-title span { background: linear-gradient(135deg, #4f46e5, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.bk4-hero-desc { font-size: 1rem; color: #6b7280; margin-bottom: 34px; max-width: 460px; }
.bk4-hero-actions { display: flex !important; gap: 14px; flex-wrap: wrap; margin-bottom: 44px; }
.bk4-btn-primary { background: #4f46e5; color: #fff !important; padding: 13px 28px; border-radius: 8px; font-size: .95rem; font-weight: 700; display: inline-flex !important; align-items: center; gap: 8px; box-shadow: 0 6px 20px rgba(79,70,229,.24); transition: background .2s, transform .15s; }
.bk4-btn-primary:hover { background: #4338ca; transform: translateY(-2px); }
.bk4-btn-outline { background: transparent; color: #4f46e5 !important; padding: 13px 28px; border-radius: 8px; font-size: .95rem; font-weight: 600; border: 2px solid #4f46e5; transition: background .2s, color .2s; }
.bk4-btn-outline:hover { background: #4f46e5; color: #fff !important; }
.bk4-hero-stats { display: flex !important; gap: 32px; flex-wrap: wrap; padding-top: 28px; border-top: 1px solid #e0e7ff; }
.bk4-stat-num { font-size: 1.7rem; font-weight: 800; color: #4f46e5; }
.bk4-stat-lbl { font-size: .76rem; color: #6b7280; font-weight: 500; }
.bk4-car-card { background: #fff; border-radius: 16px; padding: 26px; box-shadow: 0 4px 6px rgba(0,0,0,.04), 0 10px 40px rgba(79,70,229,.08); position: relative; width: 100%; border: 1px solid #e0e7ff; }
.bk4-car-pill { position: absolute; top: 16px; left: 16px; background: #10b981; color: #fff; font-size: .7rem; font-weight: 700; padding: 3px 12px; border-radius: 6px; }
.bk4-car-thumb { background: linear-gradient(135deg, #ede9fe, #e0e7ff); border-radius: 12px; padding: 22px; font-size: 4.5rem; text-align: center; line-height: 1; border: 1px solid #c4b5fd; }
.bk4-car-name { font-size: 1.05rem; font-weight: 700; margin: 14px 0 4px; color: #1e1b4b; }
.bk4-car-sub { font-size: .78rem; color: #6b7280; }
.bk4-car-footer { display: flex !important; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e0e7ff; }
.bk4-car-price { font-size: 1.1rem; font-weight: 800; color: #4f46e5; }
.bk4-car-price small { font-size: .72rem; font-weight: 500; color: #6b7280; }
.bk4-btn-book { background: #4f46e5; color: #fff !important; padding: 8px 18px; border-radius: 6px; font-size: .8rem; font-weight: 700; transition: background .2s; }
.bk4-btn-book:hover { background: #4338ca; }

/* SEARCH */
.bk4-search-section { background: #f3f4f6; padding: 0 0 24px; width: 100%; }
.bk4-search-box { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,.04), 0 10px 40px rgba(0,0,0,.06); border: 1px solid #e0e7ff; padding: 22px 26px; display: flex !important; gap: 14px; align-items: flex-end; flex-wrap: wrap; margin-top: -36px; position: relative; z-index: 10; }
.bk4-field { flex: 1 1 140px; min-width: 0; }
.bk4-field label { display: block; font-size: .7rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.bk4-field input, .bk4-field select { width: 100%; padding: 9px 12px; border: 1.5px solid #e0e7ff; border-radius: 8px; font-size: .88rem; font-family: inherit; color: #1e1b4b; background: #fafaf9; outline: none; transition: border-color .2s; appearance: auto; }
.bk4-field input:focus, .bk4-field select:focus { border-color: #4f46e5; }
.bk4-btn-search { background: #4f46e5; color: #fff; padding: 10px 24px; border-radius: 8px; font-size: .9rem; font-weight: 700; border: none; cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0; transition: background .2s; }
.bk4-btn-search:hover { background: #4338ca; }

/* SECTIONS */
.bk4-section { padding: 72px 0; width: 100%; }
.bk4-section-light { background: #fafaf9; }
.bk4-section-gray { background: #f3f4f6; }
.bk4-section-white { background: #ffffff; }
.bk4-sec-head { text-align: center; margin-bottom: 52px; }
.bk4-sec-label { font-size: .72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #4f46e5; margin-bottom: 10px; }
.bk4-sec-title { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 800; color: #1e1b4b; }
.bk4-sec-sub { color: #6b7280; margin-top: 10px; font-size: .93rem; max-width: 500px; margin-left: auto !important; margin-right: auto !important; text-align: center !important; display: block !important; }

/* SERVICE CARDS */
.bk4-svc-grid { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.bk4-svc-card { background: #fff; border-radius: 12px; padding: 28px 22px; border: 1px solid #e0e7ff; text-align: center; transition: transform .25s, box-shadow .25s; }
.bk4-svc-card:hover { transform: translateY(-4px); box-shadow: 0 10px 40px rgba(79,70,229,.1); }
.bk4-svc-icon { width: 52px; height: 52px; border-radius: 12px; background: #ede9fe; border: 1px solid #c4b5fd; display: inline-flex !important; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 16px; }
.bk4-svc-card h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #1e1b4b; }
.bk4-svc-card p { font-size: .83rem; color: #6b7280; }

/* FLEET */
.bk4-fleet-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.bk4-fleet-card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e7ff; transition: transform .25s, box-shadow .25s; }
.bk4-fleet-card:hover { transform: translateY(-4px); box-shadow: 0 10px 40px rgba(79,70,229,.1); }
.bk4-fleet-thumb { background: linear-gradient(135deg, #ede9fe, #e0e7ff); padding: 22px 16px 14px; font-size: 3.5rem; text-align: center; line-height: 1; height: 110px; display: flex !important; align-items: center; justify-content: center; }
.bk4-fleet-body { padding: 16px 18px 18px; }
.bk4-fleet-cat { font-size: .66rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #10b981; margin-bottom: 5px; }
.bk4-fleet-body h3 { font-size: .97rem; font-weight: 700; margin-bottom: 8px; color: #1e1b4b; }
.bk4-fleet-specs { display: flex !important; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.bk4-spec { font-size: .71rem; color: #6b7280; display: flex !important; align-items: center; gap: 3px; }
.bk4-fleet-foot { display: flex !important; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e0e7ff; }
.bk4-price { font-weight: 800; color: #4f46e5; font-size: .93rem; }
.bk4-price small { font-size: .7rem; font-weight: 500; color: #6b7280; }

/* HOW */
.bk4-steps { display: flex !important; gap: 0; position: relative; justify-content: center; }
.bk4-steps::before { content: ''; position: absolute; top: 26px; left: 12%; right: 12%; height: 1px; background: #e0e7ff; }
.bk4-step { flex: 1; text-align: center; position: relative; z-index: 1; padding: 0 16px; }
.bk4-step-num { width: 52px; height: 52px; border-radius: 12px; background: #4f46e5; color: #fff; display: inline-flex !important; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; margin-bottom: 14px; }
.bk4-step h4 { font-size: .9rem; font-weight: 700; margin-bottom: 6px; color: #1e1b4b; }
.bk4-step p { font-size: .78rem; color: #6b7280; }

/* TESTIMONIALS */
.bk4-testi-grid { display: grid !important; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.bk4-testi-card { background: #fff; border-radius: 12px; padding: 24px 22px; border: 1px solid #e0e7ff; }
.bk4-stars { color: #f59e0b; font-size: 1rem; margin-bottom: 12px; }
.bk4-testi-text { font-size: .86rem; color: #6b7280; margin-bottom: 18px; font-style: italic; }
.bk4-testi-user { display: flex !important; align-items: center; gap: 10px; }
.bk4-avatar { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; background: linear-gradient(135deg, #4f46e5, #10b981); display: inline-flex !important; align-items: center; justify-content: center; font-size: .86rem; color: #fff; font-weight: 700; }
.bk4-testi-name { font-weight: 700; font-size: .86rem; color: #1e1b4b; }
.bk4-testi-role { font-size: .74rem; color: #6b7280; }

/* CTA */
.bk4-cta { background: #1e1b4b; padding: 72px 0; text-align: center; width: 100%; position: relative; overflow: hidden; }
.bk4-cta::before { content: ''; position: absolute; top: -60px; right: -60px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(79,70,229,.3) 0%, transparent 70%); }
.bk4-cta h2 { font-size: clamp(1.6rem, 3.5vw, 2.5rem); color: #fff; margin-bottom: 12px; font-weight: 800; position: relative; }
.bk4-cta p { font-size: .95rem; color: rgba(255,255,255,.7); max-width: 440px; margin: 0 auto 30px; position: relative; }
.bk4-btn-cta { background: linear-gradient(135deg, #4f46e5, #10b981); color: #fff !important; padding: 13px 34px; border-radius: 8px; font-size: .95rem; font-weight: 700; box-shadow: 0 8px 24px rgba(79,70,229,.3); display: inline-block !important; position: relative; transition: transform .2s, box-shadow .2s; }
.bk4-btn-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(79,70,229,.4); }

/* FOOTER */
.bk4-footer { background: #f3f4f6; padding: 56px 0 28px; width: 100%; border-top: 1px solid #e0e7ff; }
.bk4-footer-grid { display: grid !important; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 36px; margin-bottom: 40px; }
.bk4-footer-brand h3 { color: #4f46e5; font-size: 1.2rem; font-weight: 800; margin-bottom: 10px; }
.bk4-footer-brand p { font-size: .81rem; line-height: 1.7; color: #6b7280; }
.bk4-footer-col h4 { color: #1e1b4b; font-size: .86rem; font-weight: 700; margin-bottom: 14px; }
.bk4-footer-col li { margin-bottom: 8px; }
.bk4-footer-col li a { color: #6b7280; font-size: .8rem; transition: color .2s; }
.bk4-footer-col li a:hover { color: #4f46e5; }
.bk4-footer-bottom { border-top: 1px solid #e0e7ff; padding-top: 22px; text-align: center; font-size: .76rem; color: #9ca3af; }

@media (max-width: 900px) {
    .bk4-svc-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk4-fleet-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk4-testi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .bk4-footer-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 700px) {
    .bk4-hero-inner { flex-direction: column !important; text-align: center; padding: 0 16px; }
    .bk4-hero-image { flex: 0 0 auto !important; width: 100%; max-width: 340px; margin: 0 auto; }
    .bk4-hero-actions { justify-content: center; }
    .bk4-hero-stats { justify-content: center; }
    .bk4-nav-links { display: none !important; }
    .bk4-steps::before { display: none; }
    .bk4-fleet-grid { grid-template-columns: 1fr !important; }
    .bk4-testi-grid { grid-template-columns: 1fr !important; }
    .bk4-footer-grid { grid-template-columns: 1fr !important; }
    .bk4-search-box { flex-direction: column !important; }
    .bk4-field { flex: 0 0 auto !important; width: 100%; }
}
CSS;

        $html = <<<'HTML'
<div class="bk4-wrap">

<nav class="bk4-nav">
  <div class="bk4-nav-inner">
    <span class="bk4-brand"><span class="bk4-brand-dot"></span> Bintang Kejora</span>
    <ul class="bk4-nav-links">
      <li><a href="#bk4-layanan">Layanan</a></li>
      <li><a href="#bk4-armada">Armada</a></li>
      <li><a href="#bk4-cara">Cara Sewa</a></li>
      <li><a href="#bk4-testimoni">Testimoni</a></li>
    </ul>
    <a href="#bk4-booking" class="bk4-btn-nav">Pesan Sekarang</a>
  </div>
</nav>

<section class="bk4-hero" id="bk4-hero">
  <div class="bk4-container">
    <div class="bk4-hero-inner">
      <div class="bk4-hero-content">
        <div class="bk4-badge"><span class="bk4-badge-dot"></span> Dipercaya Ribuan Pelanggan</div>
        <h1 class="bk4-hero-title">Solusi Transportasi<br><span>Modern &amp; Terpercaya</span></h1>
        <p class="bk4-hero-desc">Platform rental kendaraan roda empat yang efisien dan transparan. Pesan kapan saja, di mana saja — armada terbaik selalu siap untuk Anda.</p>
        <div class="bk4-hero-actions">
          <a href="#bk4-armada" class="bk4-btn-primary">🚗 Jelajahi Armada</a>
          <a href="#bk4-cara" class="bk4-btn-outline">Pelajari Lebih Lanjut</a>
        </div>
        <div class="bk4-hero-stats">
          <div><div class="bk4-stat-num">500+</div><div class="bk4-stat-lbl">Unit Armada</div></div>
          <div><div class="bk4-stat-num">12K+</div><div class="bk4-stat-lbl">Pelanggan Aktif</div></div>
          <div><div class="bk4-stat-num">50+</div><div class="bk4-stat-lbl">Kota Tersedia</div></div>
        </div>
      </div>
      <div class="bk4-hero-image">
        <div class="bk4-car-card">
          <span class="bk4-car-pill">Top Pick</span>
          <div class="bk4-car-thumb">🚙</div>
          <div class="bk4-car-name">Toyota Innova Reborn</div>
          <div class="bk4-car-sub">7 Penumpang · Otomatis · BBM Diesel</div>
          <div class="bk4-car-footer">
            <div class="bk4-car-price">Rp 650.000 <small>/ hari</small></div>
            <a href="#bk4-booking" class="bk4-btn-book">Pesan</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bk4-search-section" id="bk4-booking">
  <div class="bk4-container">
    <div class="bk4-search-box">
      <div class="bk4-field"><label>Kota Penjemputan</label><select><option>Jakarta</option><option>Surabaya</option><option>Bandung</option><option>Bali</option><option>Yogyakarta</option></select></div>
      <div class="bk4-field"><label>Tanggal Mulai</label><input type="date" /></div>
      <div class="bk4-field"><label>Tanggal Selesai</label><input type="date" /></div>
      <div class="bk4-field"><label>Jenis Kendaraan</label><select><option>Semua Tipe</option><option>MPV</option><option>SUV</option><option>Sedan</option><option>City Car</option></select></div>
      <button class="bk4-btn-search">🔍 Cari Mobil</button>
    </div>
  </div>
</section>

<section class="bk4-section bk4-section-gray" id="bk4-layanan">
  <div class="bk4-container">
    <div class="bk4-sec-head">
      <div class="bk4-sec-label">Layanan</div>
      <h2 class="bk4-sec-title">Dirancang Untuk Kenyamanan Anda</h2>
      <p class="bk4-sec-sub">Dari kebutuhan harian hingga perjalanan jarak jauh, kami memiliki solusi yang tepat.</p>
    </div>
    <div class="bk4-svc-grid">
      <div class="bk4-svc-card"><div class="bk4-svc-icon">🚗</div><h3>Sewa Mandiri</h3><p>Kendaraan tanpa sopir untuk fleksibilitas penuh perjalanan Anda.</p></div>
      <div class="bk4-svc-card"><div class="bk4-svc-icon">👤</div><h3>Dengan Sopir</h3><p>Sopir profesional berpengalaman siap melayani kebutuhan Anda.</p></div>
      <div class="bk4-svc-card"><div class="bk4-svc-icon">✈️</div><h3>Transfer Bandara</h3><p>Layanan penjemputan dan pengantaran bandara yang tepat waktu.</p></div>
      <div class="bk4-svc-card"><div class="bk4-svc-icon">🏢</div><h3>Korporat</h3><p>Solusi armada lengkap untuk kebutuhan operasional perusahaan Anda.</p></div>
    </div>
  </div>
</section>

<section class="bk4-section bk4-section-white" id="bk4-armada">
  <div class="bk4-container">
    <div class="bk4-sec-head">
      <div class="bk4-sec-label">Armada</div>
      <h2 class="bk4-sec-title">Pilih Kendaraan Yang Tepat</h2>
      <p class="bk4-sec-sub">Armada lengkap dan terawat untuk memenuhi setiap kebutuhan perjalanan Anda.</p>
    </div>
    <div class="bk4-fleet-grid">
      <div class="bk4-fleet-card"><div class="bk4-fleet-thumb">🚙</div><div class="bk4-fleet-body"><div class="bk4-fleet-cat">MPV Premium</div><h3>Toyota Innova Reborn</h3><div class="bk4-fleet-specs"><span class="bk4-spec">👥 7 Penumpang</span><span class="bk4-spec">⚙️ Otomatis</span><span class="bk4-spec">⛽ Diesel</span></div><div class="bk4-fleet-foot"><div class="bk4-price">Rp 650.000 <small>/ hari</small></div><a href="#bk4-booking" class="bk4-btn-book">Pesan</a></div></div></div>
      <div class="bk4-fleet-card"><div class="bk4-fleet-thumb">🏎️</div><div class="bk4-fleet-body"><div class="bk4-fleet-cat">SUV Mewah</div><h3>Toyota Fortuner</h3><div class="bk4-fleet-specs"><span class="bk4-spec">👥 7 Penumpang</span><span class="bk4-spec">⚙️ Otomatis</span><span class="bk4-spec">⛽ Diesel</span></div><div class="bk4-fleet-foot"><div class="bk4-price">Rp 900.000 <small>/ hari</small></div><a href="#bk4-booking" class="bk4-btn-book">Pesan</a></div></div></div>
      <div class="bk4-fleet-card"><div class="bk4-fleet-thumb">🚗</div><div class="bk4-fleet-body"><div class="bk4-fleet-cat">Sedan</div><h3>Toyota Camry</h3><div class="bk4-fleet-specs"><span class="bk4-spec">👥 5 Penumpang</span><span class="bk4-spec">⚙️ Otomatis</span><span class="bk4-spec">⛽ Bensin</span></div><div class="bk4-fleet-foot"><div class="bk4-price">Rp 1.200.000 <small>/ hari</small></div><a href="#bk4-booking" class="bk4-btn-book">Pesan</a></div></div></div>
      <div class="bk4-fleet-card"><div class="bk4-fleet-thumb">🚐</div><div class="bk4-fleet-body"><div class="bk4-fleet-cat">MPV Keluarga</div><h3>Toyota Avanza</h3><div class="bk4-fleet-specs"><span class="bk4-spec">👥 7 Penumpang</span><span class="bk4-spec">⚙️ Manual</span><span class="bk4-spec">⛽ Bensin</span></div><div class="bk4-fleet-foot"><div class="bk4-price">Rp 380.000 <small>/ hari</small></div><a href="#bk4-booking" class="bk4-btn-book">Pesan</a></div></div></div>
      <div class="bk4-fleet-card"><div class="bk4-fleet-thumb">🚌</div><div class="bk4-fleet-body"><div class="bk4-fleet-cat">Minibus</div><h3>Toyota HiAce</h3><div class="bk4-fleet-specs"><span class="bk4-spec">👥 14 Penumpang</span><span class="bk4-spec">⚙️ Manual</span><span class="bk4-spec">⛽ Diesel</span></div><div class="bk4-fleet-foot"><div class="bk4-price">Rp 1.100.000 <small>/ hari</small></div><a href="#bk4-booking" class="bk4-btn-book">Pesan</a></div></div></div>
      <div class="bk4-fleet-card"><div class="bk4-fleet-thumb">🚕</div><div class="bk4-fleet-body"><div class="bk4-fleet-cat">City Car</div><h3>Honda Brio</h3><div class="bk4-fleet-specs"><span class="bk4-spec">👥 4 Penumpang</span><span class="bk4-spec">⚙️ Otomatis</span><span class="bk4-spec">⛽ Bensin</span></div><div class="bk4-fleet-foot"><div class="bk4-price">Rp 280.000 <small>/ hari</small></div><a href="#bk4-booking" class="bk4-btn-book">Pesan</a></div></div></div>
    </div>
  </div>
</section>

<section class="bk4-section bk4-section-gray" id="bk4-cara">
  <div class="bk4-container">
    <div class="bk4-sec-head">
      <div class="bk4-sec-label">Cara Menyewa</div>
      <h2 class="bk4-sec-title">Proses Pemesanan Sederhana</h2>
      <p class="bk4-sec-sub">4 langkah mudah untuk mendapatkan kendaraan yang Anda inginkan.</p>
    </div>
    <div class="bk4-steps">
      <div class="bk4-step"><div class="bk4-step-num">1</div><h4>Pilih Kendaraan</h4><p>Telusuri katalog armada sesuai kebutuhan Anda.</p></div>
      <div class="bk4-step"><div class="bk4-step-num">2</div><h4>Isi Formulir</h4><p>Lengkapi data perjalanan dan informasi pribadi.</p></div>
      <div class="bk4-step"><div class="bk4-step-num">3</div><h4>Pembayaran</h4><p>Bayar dengan metode pembayaran pilihan Anda.</p></div>
      <div class="bk4-step"><div class="bk4-step-num">4</div><h4>Berangkat</h4><p>Kendaraan siap diantar ke lokasi yang ditentukan.</p></div>
    </div>
  </div>
</section>

<section class="bk4-section bk4-section-white" id="bk4-testimoni">
  <div class="bk4-container">
    <div class="bk4-sec-head">
      <div class="bk4-sec-label">Testimoni</div>
      <h2 class="bk4-sec-title">Dipercaya Ribuan Pelanggan</h2>
    </div>
    <div class="bk4-testi-grid">
      <div class="bk4-testi-card"><div class="bk4-stars">★★★★★</div><p class="bk4-testi-text">"Platform yang sangat mudah digunakan dan responsif. Armadanya juga bersih dan terawat."</p><div class="bk4-testi-user"><div class="bk4-avatar">AR</div><div><div class="bk4-testi-name">Andi Rahmanto</div><div class="bk4-testi-role">Pelanggan · Jakarta</div></div></div></div>
      <div class="bk4-testi-card"><div class="bk4-stars">★★★★★</div><p class="bk4-testi-text">"Proses pemesanan cepat dan transparan. Kendaraan yang dikirim sesuai dengan yang dipesan."</p><div class="bk4-testi-user"><div class="bk4-avatar">SP</div><div><div class="bk4-testi-name">Sari Permata</div><div class="bk4-testi-role">Pelanggan · Surabaya</div></div></div></div>
      <div class="bk4-testi-card"><div class="bk4-stars">★★★★☆</div><p class="bk4-testi-text">"Layanan profesional dan tepat waktu. Cocok untuk kebutuhan perjalanan bisnis."</p><div class="bk4-testi-user"><div class="bk4-avatar">BW</div><div><div class="bk4-testi-name">Bagus Wicaksono</div><div class="bk4-testi-role">Pelanggan · Yogyakarta</div></div></div></div>
    </div>
  </div>
</section>

<section class="bk4-cta">
  <div class="bk4-container">
    <h2>Mulai Perjalanan Anda Sekarang</h2>
    <p>Bergabung dengan ribuan pelanggan yang telah mempercayakan perjalanan mereka kepada kami.</p>
    <a href="#bk4-booking" class="bk4-btn-cta">🚗 Pesan Sekarang</a>
  </div>
</section>

<footer class="bk4-footer">
  <div class="bk4-container">
    <div class="bk4-footer-grid">
      <div class="bk4-footer-brand"><h3>Bintang Kejora</h3><p>Platform rental kendaraan roda empat yang modern dan terpercaya. Hadir di 50+ kota di seluruh Indonesia.</p></div>
      <div class="bk4-footer-col"><h4>Layanan</h4><ul><li><a href="#">Sewa Mandiri</a></li><li><a href="#">Dengan Sopir</a></li><li><a href="#">Transfer Bandara</a></li><li><a href="#">Korporat</a></li></ul></div>
      <div class="bk4-footer-col"><h4>Armada</h4><ul><li><a href="#">MPV &amp; Minibus</a></li><li><a href="#">SUV</a></li><li><a href="#">Sedan</a></li><li><a href="#">City Car</a></li></ul></div>
      <div class="bk4-footer-col"><h4>Kontak</h4><ul><li><a href="#">📞 +62 812-3456-7890</a></li><li><a href="#">📧 info@bintangkejora.id</a></li><li><a href="#">📍 Jakarta, Indonesia</a></li><li><a href="#">💬 WhatsApp</a></li></ul></div>
    </div>
    <div class="bk4-footer-bottom">© 2025 Bintang Kejora. Seluruh hak cipta dilindungi.</div>
  </div>
</footer>

</div>
HTML;

        Page::create([
            'user_id' => $userId,
            'title' => '[Template 4] Bintang Kejora – Bersih Modern',
            'slug' => 'landing-clean-minimal',
            'html' => $html,
            'css' => $css,
            'gjs_data' => null,
            'is_published' => true,
            'is_homepage' => false,
        ]);
    }
}

<?php

namespace Modules\Pages\Support;

class RentalLandingPageTemplate
{
    /**
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: array<string, mixed>}
     */
    public static function build(): array
    {
        return [
            'title' => 'Beranda',
            'slug' => 'beranda',
            'html' => self::html(),
            'css' => self::css(),
            'gjs_data' => self::gjsData(),
        ];
    }

    public static function html(): string
    {
        return <<<'HTML'
<div class="landing-page-root">
    <!-- Navbar Header -->
    <header class="header-nav">
        <div class="container nav-container">
            <div class="brand">
                <span class="brand-badge">PRO</span>
                <span class="brand-title">Rental Mobil Premium</span>
            </div>
            <nav class="nav-links">
                <a href="#armada" class="nav-link">Armada</a>
                <a href="#keunggulan" class="nav-link">Keunggulan</a>
                <a href="#cara-pesan" class="nav-link">Cara Pesan</a>
                <a href="/book/rental" class="btn-primary">Pesan Sekarang</a>
            </nav>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="container hero-content">
            <span class="hero-tag">Sewa Mobil Lepas Kunci & Dengan Sopir</span>
            <h1 class="hero-title">Solusi Perjalanan Nyaman & Terpercaya</h1>
            <p class="hero-subtitle">Nikmati pengalaman berkendara terbaik dengan armada mobil terbaru, kondisi selalu bersih, terawat, dan harga paling kompetitif.</p>
            
            <div class="hero-actions">
                <a href="/book/rental" class="btn-hero-primary">Cari & Pesan Mobil</a>
                <a href="#armada" class="btn-hero-secondary">Lihat Armada</a>
            </div>

            <div class="hero-stats">
                <div class="stat-item">
                    <span class="stat-num">100+</span>
                    <span class="stat-label">Armada Siap Jalan</span>
                </div>
                <div class="stat-item">
                    <span class="stat-num">24/7</span>
                    <span class="stat-label">Layanan Pelanggan</span>
                </div>
                <div class="stat-item">
                    <span class="stat-num">4.9/5</span>
                    <span class="stat-label">Rating Kepuasan</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Fleet / Armada Section -->
    <section id="armada" class="section-fleet">
        <div class="container">
            <div class="section-header">
                <span class="sub-header">Pilihan Favorit</span>
                <h2 class="section-title">Armada Kendaraan Populer</h2>
                <p class="section-desc">Pilihan armada terbaik dari berbagai kelas untuk kebutuhan pribadi, bisnis, maupun liburan keluarga.</p>
            </div>

            <div class="fleet-grid">
                <!-- Vehicle Card 1 -->
                <div class="fleet-card">
                    <div class="card-badge">SUV Premium</div>
                    <div class="card-img-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17h14M3 13l2-5h14l2 5M7 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/></svg>
                    </div>
                    <div class="card-body">
                        <h3 class="vehicle-name">Toyota Fortuner / Pajero</h3>
                        <div class="vehicle-specs">
                            <span>👥 7 Kursi</span>
                            <span>⚙️ Otomatis</span>
                            <span>❄️ AC Double</span>
                        </div>
                        <div class="card-footer">
                            <div class="price-tag">
                                <span class="price-label">Mulai Dari</span>
                                <span class="price-val">Rp 750.000<small>/hari</small></span>
                            </div>
                            <a href="/book/rental" class="btn-card-order">Pesan</a>
                        </div>
                    </div>
                </div>

                <!-- Vehicle Card 2 -->
                <div class="fleet-card">
                    <div class="card-badge">MPV Keluarga</div>
                    <div class="card-img-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17h14M3 13l2-5h14l2 5M7 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/></svg>
                    </div>
                    <div class="card-body">
                        <h3 class="vehicle-name">Toyota Innova Zenix / Reborn</h3>
                        <div class="vehicle-specs">
                            <span>👥 7 Kursi</span>
                            <span>⚙️ Otomatis</span>
                            <span>⛽ Irit BBM</span>
                        </div>
                        <div class="card-footer">
                            <div class="price-tag">
                                <span class="price-label">Mulai Dari</span>
                                <span class="price-val">Rp 550.000<small>/hari</small></span>
                            </div>
                            <a href="/book/rental" class="btn-card-order">Pesan</a>
                        </div>
                    </div>
                </div>

                <!-- Vehicle Card 3 -->
                <div class="fleet-card">
                    <div class="card-badge">City Car</div>
                    <div class="card-img-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17h14M3 13l2-5h14l2 5M7 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"/></svg>
                    </div>
                    <div class="card-body">
                        <h3 class="vehicle-name">Honda Brio / Toyota Yaris</h3>
                        <div class="vehicle-specs">
                            <span>👥 5 Kursi</span>
                            <span>⚙️ Matik/Manual</span>
                            <span>🅿️ Lincah</span>
                        </div>
                        <div class="card-footer">
                            <div class="price-tag">
                                <span class="price-label">Mulai Dari</span>
                                <span class="price-val">Rp 350.000<small>/hari</small></span>
                            </div>
                            <a href="/book/rental" class="btn-card-order">Pesan</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Why Choose Us Section -->
    <section id="keunggulan" class="section-features">
        <div class="container">
            <div class="section-header">
                <span class="sub-header">Keunggulan Layanan</span>
                <h2 class="section-title">Mengapa Memilih Layanan Rental Kami?</h2>
            </div>

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">✨</div>
                    <h3>Unit Terawat & Clean</h3>
                    <p>Setiap kendaraan melalui proses pembersihan dan inspeksi rutin sebelum diserahkan ke pelanggan.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔑</div>
                    <h3>Lepas Kunci & Sopir</h3>
                    <p>Fleksibilitas penuh memilih paket rental lepas kunci atau didampingi driver profesional ramah.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🛡️</div>
                    <h3>Proteksi Asuransi</h3>
                    <p>Perjalanan tenang dan aman dengan perlindungan asuransi komprehensif untuk setiap unit sewa.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⏱️</div>
                    <h3>Bantuan Buka 24 Jam</h3>
                    <p>Tim layanan pelanggan dan bantuan darurat jalan raya siap melayani Anda 24 jam nonstop.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Booking Process Steps -->
    <section id="cara-pesan" class="section-steps">
        <div class="container">
            <div class="section-header">
                <span class="sub-header">Proses Mudah</span>
                <h2 class="section-title">4 Langkah Mudah Pesan Mobil</h2>
            </div>

            <div class="steps-grid">
                <div class="step-card">
                    <div class="step-num">1</div>
                    <h4>Pilih Mobil</h4>
                    <p>Pilih unit kendaraan yang sesuai kebutuhan jadwal dan jumlah penumpang Anda.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">2</div>
                    <h4>Isi Detail Sewa</h4>
                    <p>Tentukan lokasi pengambilan, tanggal mulai, dan durasi masa sewa.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">3</div>
                    <h4>Konfirmasi Pembayaran</h4>
                    <p>Lakukan pembayaran aman dan upload bukti transfer melalui link konfirmasi.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">4</div>
                    <h4>Ambil Armada</h4>
                    <p>Mobil siap diambil di depot atau diantar langsung ke lokasi tujuan Anda.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Call to Action Banner -->
    <section class="cta-banner">
        <div class="container cta-content">
            <h2>Siap Untuk Perjalanan Anda Berikutnya?</h2>
            <p>Pesan armada pilihan Anda sekarang juga dengan proses cepat dan tanpa ribet.</p>
            <div class="cta-btns">
                <a href="/book/rental" class="btn-cta-primary">Pesan Mobil Online</a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
        <div class="container footer-content">
            <div class="footer-brand">
                <h3>Rental Mobil</h3>
                <p>Layanan sewa armada kendaraan terpercaya untuk perjalanan pribadi, keluarga, dan bisnis Anda.</p>
            </div>
            <div class="footer-links">
                <h4>Navigasi</h4>
                <a href="#armada">Armada Kendaraan</a>
                <a href="#keunggulan">Keunggulan</a>
                <a href="#cara-pesan">Cara Pesan</a>
                <a href="/book/rental">Booking Engine</a>
            </div>
            <div class="footer-contact">
                <h4>Hubungi Kami</h4>
                <p>📍 Layanan Operasional Depot & Antar Jemput</p>
                <p>💬 WhatsApp & Call Center Siap 24/7</p>
            </div>
        </div>
        <div class="footer-bottom">
            <div class="container">
                <p>&copy; 2026 Layanan Rental Mobil. All rights reserved.</p>
            </div>
        </div>
    </footer>
</div>
HTML;
    }

    public static function css(): string
    {
        return <<<'CSS'
:root {
    --primary-color: #0f766e;
    --primary-hover: #0d9488;
    --accent-color: #f59e0b;
    --dark-bg: #0f172a;
    --card-bg: #ffffff;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
}

body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--text-main);
    background-color: #f8fafc;
}

.landing-page-root {
    width: 100%;
    overflow-x: hidden;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

/* Header & Nav */
.header-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 0;
}

.nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.brand-badge {
    background: var(--accent-color);
    color: #000;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
}

.brand-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--dark-bg);
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.nav-link {
    color: var(--text-main);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    transition: color 0.2s;
}

.nav-link:hover {
    color: var(--primary-color);
}

.btn-primary {
    background: var(--primary-color);
    color: #fff;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 700;
    transition: background 0.2s;
}

.btn-primary:hover {
    background: var(--primary-hover);
}

/* Hero Section */
.hero-section {
    position: relative;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #fff;
    padding: 6rem 0 5rem;
    text-align: center;
}

.hero-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
}

.hero-tag {
    display: inline-block;
    background: rgba(15, 118, 110, 0.3);
    border: 1px solid var(--primary-color);
    color: #2dd4bf;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.4rem 1rem;
    border-radius: 50px;
    margin-bottom: 1.5rem;
}

.hero-title {
    font-size: 3rem;
    font-weight: 900;
    line-height: 1.2;
    margin-bottom: 1.25rem;
}

.hero-subtitle {
    font-size: 1.15rem;
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 2.5rem;
}

.hero-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3.5rem;
}

.btn-hero-primary {
    background: var(--primary-color);
    color: #fff;
    padding: 0.9rem 2rem;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.05rem;
    box-shadow: 0 10px 25px -5px rgba(15, 118, 110, 0.4);
}

.btn-hero-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    padding: 0.9rem 2rem;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.05rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
}

.stat-num {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: #2dd4bf;
}

.stat-label {
    font-size: 0.875rem;
    color: #94a3b8;
}

/* Section Header */
.section-header {
    text-align: center;
    max-width: 650px;
    margin: 0 auto 3rem;
}

.sub-header {
    color: var(--primary-color);
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.section-title {
    font-size: 2.25rem;
    font-weight: 800;
    margin: 0.5rem 0 1rem;
    color: var(--dark-bg);
}

.section-desc {
    color: var(--text-muted);
    font-size: 1.05rem;
}

/* Fleet Section */
.section-fleet {
    padding: 5rem 0;
}

.fleet-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
}

.fleet-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    transition: transform 0.3s, box-shadow 0.3s;
}

.fleet-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.card-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #e0f2fe;
    color: #0369a1;
    font-weight: 700;
    font-size: 0.75rem;
    padding: 0.3rem 0.75rem;
    border-radius: 50px;
}

.card-img-placeholder {
    height: 180px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
}

.card-body {
    padding: 1.5rem;
}

.vehicle-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1rem;
}

.vehicle-specs {
    display: flex;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
    background: #f8fafc;
    padding: 0.6rem;
    border-radius: 8px;
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

.price-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
}

.price-val {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--primary-color);
}

.btn-card-order {
    background: var(--dark-bg);
    color: #fff;
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
}

/* Features Section */
.section-features {
    padding: 5rem 0;
    background: #ffffff;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.feature-card {
    padding: 2rem;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    text-align: left;
}

.feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.feature-card h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
}

.feature-card p {
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
}

/* Steps Section */
.section-steps {
    padding: 5rem 0;
}

.steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
}

.step-card {
    background: #fff;
    padding: 2rem 1.5rem;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    text-align: center;
    position: relative;
}

.step-num {
    width: 48px;
    height: 48px;
    background: var(--primary-color);
    color: #fff;
    font-weight: 800;
    font-size: 1.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;
}

.step-card h4 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
}

.step-card p {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0;
}

/* CTA Banner */
.cta-banner {
    background: linear-gradient(135deg, var(--primary-color) 0%, #0d9488 100%);
    color: #fff;
    padding: 4rem 0;
    text-align: center;
}

.cta-content h2 {
    font-size: 2.25rem;
    font-weight: 800;
    margin: 0 0 1rem;
}

.cta-content p {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 2rem;
}

.btn-cta-primary {
    background: #ffffff;
    color: var(--primary-color);
    padding: 0.9rem 2.2rem;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 800;
    font-size: 1.05rem;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

/* Footer */
.landing-footer {
    background: var(--dark-bg);
    color: #94a3b8;
    padding: 4rem 0 0;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2.5rem;
    padding-bottom: 3rem;
}

.footer-brand h3 {
    color: #fff;
    font-size: 1.3rem;
    margin: 0 0 1rem;
}

.footer-links h4, .footer-contact h4 {
    color: #fff;
    font-size: 1rem;
    margin: 0 0 1rem;
}

.footer-links a {
    display: block;
    color: #94a3b8;
    text-decoration: none;
    margin-bottom: 0.5rem;
}

.footer-links a:hover {
    color: #fff;
}

.footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem 0;
    text-align: center;
    font-size: 0.875rem;
}

@media (max-width: 768px) {
    .hero-title { font-size: 2rem; }
    .nav-links { display: none; }
    .hero-stats { grid-template-columns: 1fr; }
}
CSS;
    }

    /**
     * @return array<string, mixed>
     */
    public static function gjsData(): array
    {
        return [
            'assets' => [],
            'styles' => [],
            'pages' => [
                [
                    'name' => 'Beranda',
                    'component' => [
                        'type' => 'wrapper',
                        'components' => [
                            ['type' => 'text', 'content' => self::html()],
                        ],
                    ],
                ],
            ],
        ];
    }
}

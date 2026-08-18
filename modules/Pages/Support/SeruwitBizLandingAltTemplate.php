<?php

namespace Modules\Pages\Support;

class SeruwitBizLandingAltTemplate
{
    /**
     * Build the data array for the Seruwit Biz bright‑soft landing page.
     *
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: null}
     */
    public static function build(): array
    {
        $css = self::css();
        $html = self::html();

        return [
            'title' => 'Seruwit Biz – Bright & Soft Landing Page',
            'slug' => 'seruwit-biz-alt',
            'html' => '<style>'.$css.'</style>\n'.$html,
            'css' => $css,
            'gjs_data' => null,
        ];
    }

    public static function css(): string
    {
        return <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.srb-alt-root {
    --srb-bg-base: #fdf9f5;               /* pastel base */
    --srb-bg-white: #ffffff;
    --srb-bg-soft-blue: #f0f9ff;          /* soft sky */
    --srb-bg-soft-purple: #faf5ff;        /* soft lavender */
    --srb-bg-soft-emerald: #f0fdf4;       /* soft green */

    --srb-indigo: #4f46e5;
    --srb-violet: #8b5cf6;
    --srb-sky: #0ea5e9;
    --srb-emerald: #10b981;
    --srb-rose: #f43f5e;
    --srb-amber: #f59e0b;

    --srb-grad-brand: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%);
    --srb-grad-primary: linear-gradient(135deg, #8b5cf6 0%, #f43f5e 100%);
    --srb-grad-accent: linear-gradient(135deg, #0ea5e9 0%, #10b981 100%);
    --srb-grad-hero-bg: radial-gradient(circle at 50% -15%, rgba(79,70,229,0.12) 0%, transparent 60%),
                        radial-gradient(circle at 85% 30%, rgba(244,63,94,0.08) 0%, transparent 45%),
                        radial-gradient(circle at 15% 65%, rgba(14,165,233,0.08) 0%, transparent 50%),
                        radial-gradient(circle at 75% 85%, rgba(16,185,129,0.06) 0%, transparent 40%);

    --srb-text-dark: #0f172a;
    --srb-text-main: #334155;
    --srb-text-muted: #64748b;
    --srb-border: #e2e8f0;
    --srb-border-soft: rgba(226,232,240,0.7);

    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--srb-text-main);
    background-color: var(--srb-bg-base);
    line-height: 1.6;
    width: 100%;
    overflow-x: hidden;
}

.srb-alt-root *,
.srb-alt-root *::before,
.srb-alt-root *::after {
    box-sizing: border-box;
}

/* Re‑use the same component classes as the original template but prefixed with .srb-alt- */
.srb-alt-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* Navbar */
.srb-alt-navbar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.94); backdrop-filter: blur(20px); border-bottom: 1px solid var(--srb-border); }
.srb-alt-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 76px; }
.srb-alt-brand { font-size: 1.35rem; font-weight: 800; color: var(--srb-text-dark) !important; display: flex; align-items: center; gap: 12px; text-decoration: none; }
.srb-alt-brand-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--srb-grad-brand); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 1.2rem; box-shadow: 0 6px 18px rgba(79,70,229,0.35); }
.srb-alt-nav-links { display: flex; gap: 32px; align-items: center; list-style: none; margin: 0; padding: 0; }
.srb-alt-nav-links a { font-size: 0.92rem; font-weight: 600; color: var(--srb-text-main) !important; text-decoration: none; transition: color 0.2s; }
.srb-alt-nav-links a:hover { color: var(--srb-indigo) !important; }
.srb-alt-btn-login { color: var(--srb-text-dark) !important; font-size: 0.9rem; font-weight: 700; padding: 10px 22px; border-radius: 50px; text-decoration: none; transition: all 0.2s; }
.srb-alt-btn-login:hover { background: var(--srb-bg-soft-blue); color: var(--srb-indigo) !important; }
.srb-alt-btn-portal { background: var(--srb-grad-brand); color: #ffffff !important; padding: 11px 26px; border-radius: 50px; font-size: 0.9rem; font-weight: 700; text-decoration: none; box-shadow: 0 4px 18px rgba(79,70,229,0.35); transition: all 0.2s; white-space: nowrap; }
.srb-alt-btn-portal:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,70,229,0.5); }

/* Hero */
.srb-alt-hero { position: relative; padding: 95px 0 100px; background: var(--srb-grad-hero-bg), var(--srb-bg-base); width: 100%; }
.srb-alt-hero-grid { display: flex; align-items: center; gap: 56px; }
.srb-alt-hero-content { flex: 1.1; min-width: 0; }
.srb-alt-hero-visual { flex: 0.9; min-width: 0; }
.srb-alt-hero-title { font-size: clamp(2.4rem,4.3vw,3.4rem); font-weight: 800; color: var(--srb-text-dark); line-height: 1.15; margin: 0 0 24px 0; letter-spacing: -0.03em; }
.srb-alt-hero-title span { background: var(--srb-grad-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.srb-alt-hero-subtitle { font-size: 1.1rem; color: var(--srb-text-muted); margin: 0 0 38px 0; max-width: 560px; line-height: 1.7; }
.srb-alt-btn-primary { background: var(--srb-grad-brand); color: #ffffff !important; padding: 16px 34px; border-radius: 50px; font-size: 1rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 8px 26px rgba(79,70,229,0.38); transition: all 0.2s; }
.srb-alt-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(79,70,229,0.52); }
.srb-alt-btn-secondary { background: #ffffff; color: var(--srb-text-dark) !important; padding: 10px 22px; border-radius: 50px; font-size: 1rem; font-weight: 700; text-decoration: none; border: 1px solid var(--srb-border); box-shadow: 0 4px 14px rgba(0,0,0,0.04); display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
.srb-alt-btn-secondary:hover { background: var(--srb-bg-soft-blue); border-color: #c7d2fe; transform: translateY(-1px); }

/* Sections */
.srb-alt-section { padding: 100px 0; width: 100%; }
.srb-alt-section-white { background: #ffffff; }
.srb-alt-section-soft { background: var(--srb-bg-base); }

/* Footer */
.srb-alt-footer { background: #0f172a; padding: 72px 0 36px 0; width: 100%; color: #94a3b8; }
.srb-alt-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 44px; margin-bottom: 52px; }
.srb-alt-footer-brand h3 { font-size: 1.35rem; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; }
.srb-alt-footer-brand p { font-size: 0.88rem; color: #94a3b8; line-height: 1.7; max-width: 330px; margin: 0; }
CSS;
    }

    public static function html(): string
    {
        return <<<'HTML'
<div class="srb-alt-root">
    <header class="srb-alt-navbar">
        <div class="srb-alt-container srb-alt-nav-inner">
            <a href="/" class="srb-alt-brand">
                <div class="srb-alt-brand-icon">SB</div>
                Seruwit Biz
            </a>
            <ul class="srb-alt-nav-links">
                <li><a href="#features">Fitur</a></li>
                <li><a href="#pricing">Harga</a></li>
                <li><a href="#contact">Kontak</a></li>
            </ul>
            <div class="srb-alt-btn-login">Masuk</div>
            <a href="/workspace" class="srb-alt-btn-portal">Portal Workspace</a>
        </div>
    </header>
    <section class="srb-alt-hero">
        <div class="srb-alt-container srb-alt-hero-grid">
            <div class="srb-alt-hero-content">
                <h1 class="srb-alt-hero-title">Platform <span>Seruwit Biz</span> untuk Bisnis Modern</h1>
                <p class="srb-alt-hero-subtitle">Manajemen rental kendaraan yang mudah, terintegrasi, dan dapat disesuaikan untuk kebutuhan usaha Anda.</p>
                <div class="srb-alt-btn-primary">Jelajahi Fitur</div>
                <div class="srb-alt-btn-secondary">Mulai Gratis</div>
            </div>
            <div class="srb-alt-hero-visual">
                <img src="https://via.placeholder.com/500x400" alt="Dashboard" style="width:100%;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,0.1);" />
            </div>
        </div>
    </section>
</div>
HTML;
    }
}

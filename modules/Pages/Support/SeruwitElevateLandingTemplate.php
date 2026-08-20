<?php

namespace Modules\Pages\Support;

class SeruwitElevateLandingTemplate
{
    /**
     * Build the data array for the Seruwit Elevate landing page.
     *
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: null}
     */
    public static function build(): array
    {
        $css = self::css();
        $html = self::html();

        return [
            'title' => 'Seruwit Elevate – Platform Rental Kendaraan & Ekosistem Bisnis Terpadu',
            'slug' => 'seruwit-elevate',
            'html' => '<style>'.$css.'</style>'."\n".$html,
            'css' => $css,
            'gjs_data' => null,
        ];
    }

    public static function css(): string
    {
        return <<<'CSS'
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap');

:root {
    --el-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    /* Elegant Dark & Light Base */
    --el-bg: #0b0f19;
    --el-bg-surface: #111827;
    --el-bg-card: rgba(17, 24, 39, 0.75);
    --el-bg-card-hover: rgba(30, 41, 59, 0.85);
    --el-bg-glass: rgba(255, 255, 255, 0.04);
    
    --el-text-main: #f8fafc;
    --el-text-sub: #94a3b8;
    --el-text-muted: #64748b;
    
    /* Accents */
    --el-emerald: #10b981;
    --el-emerald-glow: rgba(16, 185, 129, 0.25);
    --el-teal: #14b8a6;
    --el-cyan: #06b6d4;
    --el-indigo: #6366f1;
    --el-amber: #f59e0b;
    
    /* Gradients */
    --el-grad-primary: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
    --el-grad-text: linear-gradient(135deg, #ffffff 30%, #a7f3d0 70%, #38bdf8 100%);
    --el-grad-glow: radial-gradient(circle at 50% -10%, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.08) 40%, transparent 70%);
    
    /* Borders & Shadows */
    --el-border: rgba(255, 255, 255, 0.08);
    --el-border-focus: rgba(16, 185, 129, 0.4);
    --el-shadow-card: 0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    --el-shadow-glow: 0 0 40px -10px rgba(16, 185, 129, 0.3);
}

.el-root {
    font-family: var(--el-font);
    color: var(--el-text-main);
    background-color: var(--el-bg);
    line-height: 1.6;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow-x: hidden;
    letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased;
}

.el-root *, .el-root *::before, .el-root *::after {
    box-sizing: border-box;
}

.el-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

/* SLEEK STICKY NAVBAR */
.el-nav-wrapper {
    position: sticky;
    top: 16px;
    z-index: 999;
    padding: 0 20px;
    margin-bottom: -72px;
}
.el-navbar {
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 100px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    max-width: 1100px;
    margin: 0 auto;
    padding: 8px 12px 8px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;
}
.el-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
}
.el-brand-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--el-grad-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0b0f19;
    font-weight: 900;
    font-size: 0.95rem;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}
.el-brand-badge {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    padding: 2px 7px;
    border-radius: 20px;
    border: 1px solid rgba(16, 185, 129, 0.3);
}
.el-nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
    list-style: none;
    margin: 0;
    padding: 0;
}
.el-nav-link {
    text-decoration: none;
    color: var(--el-text-sub);
    font-size: 0.88rem;
    font-weight: 600;
    transition: all 0.2s ease;
}
.el-nav-link:hover {
    color: #ffffff;
}
.el-nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
.el-btn-ghost {
    background: transparent;
    color: var(--el-text-sub);
    font-size: 0.86rem;
    font-weight: 700;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 50px;
    transition: all 0.2s;
}
.el-btn-ghost:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
}
.el-btn-glow {
    background: var(--el-grad-primary);
    color: #0b0f19;
    font-size: 0.86rem;
    font-weight: 800;
    text-decoration: none;
    padding: 9px 20px;
    border-radius: 50px;
    box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35);
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.el-btn-glow:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
    filter: brightness(1.08);
}

/* HERO SECTION */
.el-hero {
    position: relative;
    padding: 150px 0 100px 0;
    background: var(--el-grad-glow);
    text-align: center;
    overflow: hidden;
}
.el-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 0.82rem;
    font-weight: 700;
    color: #34d399;
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
}
.el-hero-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
}
.el-hero-h1 {
    font-size: clamp(2.4rem, 5vw, 4rem);
    font-weight: 800;
    color: #ffffff;
    line-height: 1.15;
    letter-spacing: -0.03em;
    max-width: 900px;
    margin: 0 auto 24px auto;
}
.el-hero-h1 span {
    background: var(--el-grad-text);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.el-hero-p {
    font-size: 1.15rem;
    color: var(--el-text-sub);
    max-width: 660px;
    margin: 0 auto 36px auto;
    line-height: 1.65;
}
.el-hero-btns {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 50px;
}
.el-btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 700;
    text-decoration: none;
    padding: 13px 28px;
    border-radius: 50px;
    transition: all 0.2s;
    backdrop-filter: blur(10px);
}
.el-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.3);
}

/* HERO INTERACTIVE DISPLAY (STAGE) */
.el-hero-stage {
    max-width: 1060px;
    margin: 0 auto;
    background: var(--el-bg-card);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    box-shadow: var(--el-shadow-card), var(--el-shadow-glow);
    backdrop-filter: blur(24px);
    overflow: hidden;
    text-align: left;
}
.el-stage-header {
    background: rgba(15, 23, 42, 0.9);
    padding: 14px 22px;
    border-bottom: 1px solid var(--el-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.el-stage-controls {
    display: flex;
    gap: 8px;
}
.el-stage-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
}
.el-stage-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--el-text-sub);
}
.el-stage-tabs {
    display: flex;
    gap: 8px;
}
.el-stage-tab {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--el-text-sub);
    border: 1px solid var(--el-border);
}
.el-stage-tab.active {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.4);
}

.el-stage-body {
    padding: 28px;
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 28px;
    align-items: center;
}
.el-stage-kpis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.el-kpi-box {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--el-border);
    border-radius: 16px;
    padding: 16px;
}
.el-kpi-num {
    font-size: 1.6rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 2px;
}
.el-kpi-label {
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--el-text-sub);
}
.el-kpi-trend {
    font-size: 0.72rem;
    color: #34d399;
    font-weight: 700;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.el-live-radar {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--el-border);
    border-radius: 18px;
    padding: 20px;
}
.el-radar-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border);
}
.el-radar-title {
    font-size: 0.88rem;
    font-weight: 800;
    color: #ffffff;
}
.el-radar-badge {
    font-size: 0.72rem;
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 700;
}
.el-unit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.el-unit-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
.el-unit-info h5 {
    margin: 0 0 2px 0;
    font-size: 0.86rem;
    color: #ffffff;
    font-weight: 700;
}
.el-unit-info span {
    font-size: 0.75rem;
    color: var(--el-text-muted);
}
.el-unit-tag {
    font-size: 0.74rem;
    font-weight: 700;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 3px 8px;
    border-radius: 6px;
}

/* SECTION ESSENTIALS */
.el-section {
    padding: 100px 0;
    position: relative;
}
.el-head-center {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 60px auto;
}
.el-tag-pill {
    display: inline-block;
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #34d399;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 5px 14px;
    border-radius: 50px;
    margin-bottom: 16px;
}
.el-title {
    font-size: clamp(2rem, 3.5vw, 2.8rem);
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.22;
    margin: 0 0 16px 0;
}
.el-subtitle {
    font-size: 1.08rem;
    color: var(--el-text-sub);
    line-height: 1.65;
    margin: 0;
}

/* HIGHLIGHTED PRODUCT ADVANTAGES (GRID 3) */
.el-advantages-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
.el-adv-card {
    background: var(--el-bg-card);
    border: 1px solid var(--el-border);
    border-radius: 20px;
    padding: 32px 28px;
    transition: all 0.25s ease;
    backdrop-filter: blur(16px);
    position: relative;
    overflow: hidden;
}
.el-adv-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.6), transparent);
    opacity: 0;
    transition: opacity 0.25s ease;
}
.el-adv-card:hover {
    transform: translateY(-4px);
    border-color: rgba(16, 185, 129, 0.35);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.4), 0 0 25px rgba(16, 185, 129, 0.15);
}
.el-adv-card:hover::before {
    opacity: 1;
}
.el-adv-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 22px;
    color: #34d399;
}
.el-adv-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 10px 0;
}
.el-adv-desc {
    font-size: 0.92rem;
    color: var(--el-text-sub);
    line-height: 1.6;
    margin: 0;
}

/* RENTAL SPOTLIGHT HIGHLIGHTS */
.el-spotlight-wrapper {
    background: linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.7) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 28px;
    padding: 48px;
    box-shadow: var(--el-shadow-card);
    margin-bottom: 40px;
}
.el-spotlight-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 48px;
    align-items: center;
}
.el-feat-pill-list {
    display: grid;
    gap: 16px;
    margin: 28px 0;
}
.el-feat-pill {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--el-border);
    padding: 14px 18px;
    border-radius: 14px;
}
.el-feat-check {
    color: #10b981;
    font-weight: 900;
    font-size: 1.1rem;
    margin-top: 1px;
}
.el-feat-pill-text h4 {
    margin: 0 0 2px 0;
    font-size: 0.96rem;
    font-weight: 700;
    color: #ffffff;
}
.el-feat-pill-text p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--el-text-sub);
    line-height: 1.5;
}

/* MODULAR EXPANSION ECOSYSTEM */
.el-eco-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}
.el-eco-box {
    background: var(--el-bg-card);
    border: 1px solid var(--el-border);
    border-radius: 20px;
    padding: 30px;
    transition: all 0.2s ease;
}
.el-eco-box:hover {
    border-color: rgba(6, 182, 212, 0.35);
    background: var(--el-bg-card-hover);
}
.el-eco-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
}
.el-eco-icon-sm {
    font-size: 1.4rem;
}
.el-eco-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
}
.el-eco-summary {
    font-size: 0.9rem;
    color: var(--el-text-sub);
    line-height: 1.6;
    margin: 0 0 16px 0;
}
.el-eco-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.el-tag {
    font-size: 0.76rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.08);
}
.el-tag-live {
    background: rgba(16, 185, 129, 0.12);
    color: #34d399;
    border-color: rgba(16, 185, 129, 0.3);
}

/* HORIZON MARKETPLACE CALLOUT */
.el-market-callout {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 40px;
    margin-top: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
}
.el-market-text h3 {
    font-size: 1.4rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 8px 0;
}
.el-market-text p {
    font-size: 0.94rem;
    color: var(--el-text-sub);
    line-height: 1.6;
    margin: 0;
    max-width: 680px;
}

/* CARA KERJA (3 STEPS) */
.el-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
.el-step-item {
    background: var(--el-bg-card);
    border: 1px solid var(--el-border);
    border-radius: 20px;
    padding: 32px 26px;
    position: relative;
}
.el-step-badge {
    font-size: 0.8rem;
    font-weight: 900;
    color: #34d399;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}
.el-step-h {
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 10px 0;
}
.el-step-p {
    font-size: 0.9rem;
    color: var(--el-text-sub);
    line-height: 1.6;
    margin: 0;
}

/* FAQ */
.el-faq-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 1000px;
    margin: 0 auto;
}
.el-faq-box {
    background: var(--el-bg-card);
    border: 1px solid var(--el-border);
    border-radius: 16px;
    padding: 24px;
}
.el-faq-q {
    font-size: 1.02rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 8px 0;
}
.el-faq-a {
    font-size: 0.9rem;
    color: var(--el-text-sub);
    line-height: 1.6;
    margin: 0;
}

/* CTA BANNER */
.el-cta-section {
    background: radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.2) 0%, rgba(11, 15, 25, 0.9) 70%);
    border-top: 1px solid var(--el-border);
    padding: 90px 0;
    text-align: center;
}
.el-cta-h2 {
    font-size: clamp(2rem, 3.8vw, 3rem);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 16px 0;
    letter-spacing: -0.02em;
}
.el-cta-desc {
    font-size: 1.1rem;
    color: var(--el-text-sub);
    max-width: 600px;
    margin: 0 auto 36px auto;
}

/* MINIMALIST FOOTER */
.el-footer {
    background: #070a11;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding: 60px 0 30px 0;
    color: var(--el-text-muted);
}
.el-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
}
.el-footer-brand h4 {
    font-size: 1.25rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 10px 0;
}
.el-footer-brand p {
    font-size: 0.88rem;
    color: var(--el-text-sub);
    line-height: 1.6;
    max-width: 320px;
    margin: 0 0 16px 0;
}
.el-footer-col h5 {
    font-size: 0.88rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.el-footer-menu {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
}
.el-footer-menu li a {
    color: var(--el-text-sub);
    text-decoration: none;
    font-size: 0.86rem;
    transition: color 0.2s;
}
.el-footer-menu li a:hover {
    color: #ffffff;
}
.el-footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
}

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 992px) {
    .el-stage-body, .el-spotlight-grid, .el-advantages-grid, .el-eco-grid, .el-steps-grid, .el-faq-grid {
        grid-template-columns: 1fr;
    }
    .el-footer-grid {
        grid-template-columns: 1fr 1fr;
    }
    .el-market-callout {
        flex-direction: column;
        text-align: center;
    }
    .el-nav-links {
        display: none;
    }
}
@media (max-width: 640px) {
    .el-footer-grid {
        grid-template-columns: 1fr;
    }
    .el-footer-bottom {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
    .el-stage-kpis {
        grid-template-columns: 1fr;
    }
}
CSS;
    }

    public static function html(): string
    {
        return <<<'HTML'
<div class="el-root">

  <!-- SLEEK STICKY NAVBAR -->
  <div class="el-nav-wrapper">
    <nav class="el-navbar">
      <a href="/" class="el-brand">
        <div class="el-brand-icon">⚡</div>
        <span>{{setting:general.site_name}}</span>
        <span class="el-brand-badge">Elevate</span>
      </a>

      <ul class="el-nav-links">
        <li><a href="#keunggulan" class="el-nav-link">Keunggulan</a></li>
        <li><a href="#rental" class="el-nav-link">Rental &amp; Armada</a></li>
        <li><a href="#ekosistem" class="el-nav-link">Ekosistem Modul</a></li>
        <li><a href="#cara-kerja" class="el-nav-link">Cara Kerja</a></li>
        <li><a href="#faq" class="el-nav-link">FAQ</a></li>
      </ul>

      <div class="el-nav-actions">
        <a href="/login" class="el-btn-ghost">Masuk</a>
        <a href="/workspaces" class="el-btn-glow">Coba Gratis →</a>
      </div>
    </nav>
  </div>

  <!-- HERO SECTION -->
  <header class="el-hero">
    <div class="el-container">
      <div class="el-hero-badge">
        <span class="el-hero-dot"></span> Next-Gen SaaS Rental &amp; Business Operating System
      </div>
      
      <h1 class="el-hero-h1">
        Akselerasi Bisnis Rental &amp; <span>Kembangkan Ekosistem Tanpa Batas.</span>
      </h1>

      <p class="el-hero-p">
        Dirancang khusus untuk modernisasi bisnis rental armada hari ini—lengkap dengan kalender real-time, live GPS, dan verifikasi instan—serta arsitektur modular untuk logistik, supply chain, hingga marketplace esok hari.
      </p>

      <div class="el-hero-btns">
        <a href="/workspaces" class="el-btn-glow" style="padding: 14px 32px; font-size: 0.98rem;">
          Mulai Workspace Gratis ⚡
        </a>
        <a href="#keunggulan" class="el-btn-secondary">
          Lihat Keunggulan Produk ↓
        </a>
      </div>

      <!-- HERO STAGE INTERACTIVE PREVIEW -->
      <div class="el-hero-stage">
        <div class="el-stage-header">
          <div class="el-stage-controls">
            <div class="el-stage-dot"></div>
            <div class="el-stage-dot"></div>
            <div class="el-stage-dot"></div>
          </div>
          <div class="el-stage-title">Seruwit Central Control Hub • Multi-Tenant Active</div>
          <div class="el-stage-tabs">
            <span class="el-stage-tab active">Rental &amp; Fleet</span>
            <span class="el-stage-tab">Logistics</span>
            <span class="el-stage-tab">Commerce</span>
          </div>
        </div>

        <div class="el-stage-body">
          <div class="el-stage-kpis">
            <div class="el-kpi-box">
              <div class="el-kpi-num">48 / 52</div>
              <div class="el-kpi-label">Armada Aktif Operasi</div>
              <div class="el-kpi-trend">↑ 92.3% Utilisasi Unit</div>
            </div>
            <div class="el-kpi-box">
              <div class="el-kpi-num">Rp 128Jt</div>
              <div class="el-kpi-label">Omset Rental Bulan Ini</div>
              <div class="el-kpi-trend">↑ +18.5% Pertumbuhan</div>
            </div>
            <div class="el-kpi-box">
              <div class="el-kpi-num">24 Unit</div>
              <div class="el-kpi-label">Lepas Kunci Aktif</div>
              <div class="el-kpi-trend">✓ Verifikasi KTP 100%</div>
            </div>
            <div class="el-kpi-box">
              <div class="el-kpi-num">12 Trip</div>
              <div class="el-kpi-label">Shuttle Beroperasi</div>
              <div class="el-kpi-trend">📍 Live Telemetika GPS</div>
            </div>
          </div>

          <div class="el-live-radar">
            <div class="el-radar-head">
              <span class="el-radar-title">Pemantauan Armada Real-Time</span>
              <span class="el-radar-badge">● Live GPS Tracking</span>
            </div>

            <div class="el-unit-item">
              <div class="el-unit-info">
                <h5>Toyota Innova Zenix Hybrid (B 1829 SSR)</h5>
                <span>Sewa Lepas Kunci • Rute: Sudirman → Bandara Soetta</span>
              </div>
              <span class="el-unit-tag">Bergerak (65 km/j)</span>
            </div>

            <div class="el-unit-item">
              <div class="el-unit-info">
                <h5>Toyota Fortuner 2.8 GR (B 2091 PLK)</h5>
                <span>Dengan Pengemudi • Hotel Mulia Senayan</span>
              </div>
              <span class="el-unit-tag" style="color:#34d399; background:rgba(16,185,129,0.1);">Standby Menunggu</span>
            </div>

            <div class="el-unit-item">
              <div class="el-unit-info">
                <h5>Toyota HiAce Premio Shuttle (D 7781 AB)</h5>
                <span>Rute Shuttle: Bandung Pasteur → Jakarta Semanggi</span>
              </div>
              <span class="el-unit-tag" style="color:#a78bfa; background:rgba(167,139,250,0.1);">12 Penumpang (Full)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- KEUNGGULAN PRODUK UTAMA -->
  <section class="el-section" id="keunggulan">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">Keunggulan Solusi</span>
        <h2 class="el-title">Mengapa Seruwit Lebih Unggul &amp; Intuitif?</h2>
        <p class="el-subtitle">
          Kombinasi fleksibilitas SaaS rental generasi baru dengan skalabilitas modul bisnis yang dapat diaktifkan kapan pun Anda siap.
        </p>
      </div>

      <div class="el-advantages-grid">
        <div class="el-adv-card">
          <div class="el-adv-icon">🎯</div>
          <h3 class="el-adv-title">Zero-Conflict Booking Calendar</h3>
          <p class="el-adv-desc">
            Kalender visual interaktif yang otomatis mengunci unit armada saat terjadi pesanan, membasmi risiko double-booking pada rental lepas kunci maupun dengan supir.
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">🛡️</div>
          <h3 class="el-adv-title">Automated Security &amp; Deposit</h3>
          <p class="el-adv-desc">
            Verifikasi identitas penyewa instan (KTP, SIM, selfie) dilengkapi manajemen jaminan deposit digital untuk mengamankan aset kendaraan berharga Anda.
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">📍</div>
          <h3 class="el-adv-title">Telematika &amp; Geofencing Live</h3>
          <p class="el-adv-desc">
            Koneksi langsung ke perangkat GPS armada. Pantau pergerakan kecepatan, lokasi real-time, dan batas wilayah perjalanan (geofence) secara otomatis.
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">🧩</div>
          <h3 class="el-adv-title">Arsitektur Modular Terbuka</h3>
          <p class="el-adv-desc">
            Tidak perlu mengganti aplikasi saat usaha Anda melebar. Tambahkan modul inventori gudang, POS kasir, maupun logistik hanya dengan satu klik di registry.
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">⚡</div>
          <h3 class="el-adv-title">Multi-Tenant Terisolasi Mandiri</h3>
          <p class="el-adv-desc">
            Keamanan setara enterprise. Setiap workspace tenant memiliki basis data terisolasi, enkripsi ketat, dan dukungan custom domain profesional.
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">💳</div>
          <h3 class="el-adv-title">Faktur &amp; Payment Gateway</h3>
          <p class="el-adv-desc">
            Penerbitan invoice otomatis, tautan pembayaran online (QRIS, Virtual Account, Kartu Kredit), serta rekonsiliasi kas dan piutang otomatis.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- SPOTLIGHT: RENTAL & MOBILITAS -->
  <section class="el-section" id="rental" style="padding-top: 20px;">
    <div class="el-container">
      <div class="el-spotlight-wrapper">
        <div class="el-spotlight-grid">
          <div>
            <span class="el-tag-pill">Fitur Unggulan Saat Ini</span>
            <h2 class="el-title" style="font-size: 2.3rem; margin: 10px 0 16px 0;">
              Sistem SaaS Rental &amp; Shuttle Terlengkap
            </h2>
            <p class="el-subtitle" style="font-size: 1rem;">
              Dari penerimaan order masuk, jadwal supir, cetak surat jalan, checklist serah terima kendaraan hingga laporan operasional harian.
            </p>

            <div class="el-feat-pill-list">
              <div class="el-feat-pill">
                <span class="el-feat-check">✓</span>
                <div class="el-feat-pill-text">
                  <h4>Sewa Harian, Mingguan &amp; Kontrak Korporat</h4>
                  <p>Mendukung rental retail lepas kunci, rental VIP + driver, hingga sewa jangka panjang korporasi.</p>
                </div>
              </div>

              <div class="el-feat-pill">
                <span class="el-feat-check">✓</span>
                <div class="el-feat-pill-text">
                  <h4>Shuttle Travel &amp; Ticketing Antar-Kota</h4>
                  <p>Kelola manifest penumpang, pemilihan nomor kursi, tiket digital QR, dan checkpoint rute.</p>
                </div>
              </div>

              <div class="el-feat-pill">
                <span class="el-feat-check">✓</span>
                <div class="el-feat-pill-text">
                  <h4>Pemeliharaan Armada &amp; Pengingat STNK/KIR</h4>
                  <p>Jadwal servis berkala, ganti oli, serta alarm otomatis untuk masa berlaku pajak dan uji KIR kendaraan.</p>
                </div>
              </div>
            </div>

            <a href="/workspaces" class="el-btn-glow">Coba Demo Rental Sekarang →</a>
          </div>

          <!-- MOCKUP LIST KENDARAAN POPULER -->
          <div style="display: grid; gap: 16px;">
            <div style="background:rgba(255,255,255,0.04); border:1px solid var(--el-border); border-radius:18px; padding:20px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:0.72rem; color:#38bdf8; font-weight:800; text-transform:uppercase;">SUV Luxury</span>
                <h4 style="font-size:1.1rem; font-weight:800; color:#ffffff; margin:4px 0 6px 0;">Toyota Fortuner 2.8 GR Sport</h4>
                <div style="font-size:0.8rem; color:var(--el-text-sub);">👥 7 Kursi • ⚙️ Matik • ⛽ Diesel</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.15rem; font-weight:800; color:#34d399;">Rp 850rb<span style="font-size:0.75rem; color:var(--el-text-muted);">/hari</span></div>
                <span style="font-size:0.72rem; background:rgba(16,185,129,0.15); color:#34d399; padding:2px 8px; border-radius:4px; font-weight:700;">Siap Sewa</span>
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid var(--el-border); border-radius:18px; padding:20px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:0.72rem; color:#a78bfa; font-weight:800; text-transform:uppercase;">Premium Shuttle</span>
                <h4 style="font-size:1.1rem; font-weight:800; color:#ffffff; margin:4px 0 6px 0;">Toyota HiAce Premio Luxury</h4>
                <div style="font-size:0.8rem; color:var(--el-text-sub);">👥 10 Kursi • 🛋️ Captain Seat • 👨‍✈️ Driver Included</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.15rem; font-weight:800; color:#34d399;">Rp 1.4Jt<span style="font-size:0.75rem; color:var(--el-text-muted);">/hari</span></div>
                <span style="font-size:0.72rem; background:rgba(16,185,129,0.15); color:#34d399; padding:2px 8px; border-radius:4px; font-weight:700;">Siap Sewa</span>
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.04); border:1px solid var(--el-border); border-radius:18px; padding:20px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:0.72rem; color:#f59e0b; font-weight:800; text-transform:uppercase;">Family MVP</span>
                <h4 style="font-size:1.1rem; font-weight:800; color:#ffffff; margin:4px 0 6px 0;">Toyota All New Avanza / Veloz</h4>
                <div style="font-size:0.8rem; color:var(--el-text-sub);">👥 7 Kursi • ⚙️ Matik / Manual • ❄️ Double AC</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.15rem; font-weight:800; color:#34d399;">Rp 400rb<span style="font-size:0.75rem; color:var(--el-text-muted);">/hari</span></div>
                <span style="font-size:0.72rem; background:rgba(16,185,129,0.15); color:#34d399; padding:2px 8px; border-radius:4px; font-weight:700;">Siap Sewa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ARSITEKTUR EKOSISTEM MASA DEPAN -->
  <section class="el-section" id="ekosistem">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">Ekosistem Terintegrasi</span>
        <h2 class="el-title">Modul Bisnis yang Siap Tumbuh Bersama Anda</h2>
        <p class="el-subtitle">
          Satu akun workspace untuk mengontrol mobilitas, rantai pasok gudang, penjualan toko, hingga pembukuan keuangan.
        </p>
      </div>

      <div class="el-eco-grid">
        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">🚚</span>
            <h3 class="el-eco-name">Logistik &amp; Gudang (Supply Chain)</h3>
          </div>
          <p class="el-eco-summary">
            Sistem manajemen inventori multi-gudang, purchase order (PO), tanda terima barang (GRN), surat jalan delivery (POD), dan kontrol stok real-time.
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">Inventory Multi-Gudang</span>
            <span class="el-tag el-tag-live">PO &amp; Purchasing</span>
            <span class="el-tag el-tag-live">Surat Jalan (POD)</span>
            <span class="el-tag el-tag-live">Dispatch Outbound</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">🛍️</span>
            <h3 class="el-eco-name">Commerce, POS &amp; Canvassing</h3>
          </div>
          <p class="el-eco-summary">
            Kasir Point of Sale (POS) untuk cabang fisik, aplikasi sales canvassing keliling, promo perdagangan distributor, dan katalog produk digital.
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">POS Kasir Cabang</span>
            <span class="el-tag el-tag-live">Sales Canvassing</span>
            <span class="el-tag el-tag-live">Trade Promotions</span>
            <span class="el-tag el-tag-live">Product Master</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">💼</span>
            <h3 class="el-eco-name">Keuangan &amp; Akuntansi ERP</h3>
          </div>
          <p class="el-eco-summary">
            Faktur elektronik, manajemen umur piutang (AR aging), utang usaha (AP), laporan laba rugi, buku besar akuntansi, dan matriks approval berjenjang.
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">Automated Invoicing</span>
            <span class="el-tag el-tag-live">Piutang &amp; Aging</span>
            <span class="el-tag el-tag-live">Buku Besar / GL</span>
            <span class="el-tag el-tag-live">Approval Matrix</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">⚡</span>
            <h3 class="el-eco-name">Mobilitas &amp; Telematika Cerdas</h3>
          </div>
          <p class="el-eco-summary">
            Rental kendaraan, armada shuttle antar-kota, penilaian pengemudi (Driver Scoring), manajemen dokumen legal (STNK/KIR/SIM), dan rute otomatis.
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">Rental Kendaraan</span>
            <span class="el-tag el-tag-live">Shuttle Travel</span>
            <span class="el-tag el-tag-live">Driver Scoring</span>
            <span class="el-tag el-tag-live">Fleet Maintenance</span>
          </div>
        </div>
      </div>

      <!-- HORIZON MARKETPLACE CALLOUT -->
      <div class="el-market-callout">
        <div class="el-market-text">
          <span style="font-size:0.75rem; color:#38bdf8; font-weight:800; text-transform:uppercase;">Ecosystem Horizon</span>
          <h3>🌐 B2B Marketplace &amp; E-Commerce Storefront</h3>
          <p>
            Visi masa depan Seruwit: Membuka kolaborasi antar-tenant. Saling tukar order armada sewa saat pesanan melimpah, jual beli suku cadang terpercaya, hingga etalase digital terbuka antar mitra bisnis.
          </p>
        </div>
        <div>
          <a href="/workspaces" class="el-btn-glow" style="white-space:nowrap;">Gabung Jaringan Kami →</a>
        </div>
      </div>
    </div>
  </section>

  <!-- CARA KERJA -->
  <section class="el-section" id="cara-kerja">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">Onboarding Instan</span>
        <h2 class="el-title">Mulai Operasi Tanpa Setup Rumit</h2>
        <p class="el-subtitle">Semua sistem berbasis Cloud murni—tidak perlu server fisik atau instalasi sulit.</p>
      </div>

      <div class="el-steps-grid">
        <div class="el-step-item">
          <div class="el-step-badge">1</div>
          <h3 class="el-step-h">Buat Akun Workspace</h3>
          <p class="el-step-p">Daftarkan perusahaan Anda dan dapatkan domain workspace mandiri yang terenkripsi dan terisolasi.</p>
        </div>

        <div class="el-step-item">
          <div class="el-step-badge">2</div>
          <h3 class="el-step-h">Pilih &amp; Pasang Modul</h3>
          <p class="el-step-p">Aktifkan modul Rental &amp; Armada sekarang, serta tambahkan modul logistik atau kasir kapan pun dibutuhkan.</p>
        </div>

        <div class="el-step-item">
          <div class="el-step-badge">3</div>
          <h3 class="el-step-h">Jalankan Transaksi Harian</h3>
          <p class="el-step-p">Kelola unit, input booking, pantau GPS posisi kendaraan, serta terbitkan invoice pembayaran secara otomatis.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="el-section" id="faq">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">FAQ</span>
        <h2 class="el-title">Pertanyaan yang Sering Diajukan</h2>
      </div>

      <div class="el-faq-grid">
        <div class="el-faq-box">
          <h4 class="el-faq-q">Apakah saya bisa fokus menggunakan modul rental kendaraan saja?</h4>
          <p class="el-faq-a">
            Tentu. Seruwit bersifat modular penuh. Anda dapat menggunakan modul rental secara terisolasi tanpa perlu mengaktifkan modul lainnya.
          </p>
        </div>

        <div class="el-faq-box">
          <h4 class="el-faq-q">Bagaimana jika bisnis saya berkembang ke logistik atau ritel?</h4>
          <p class="el-faq-a">
            Anda dapat langsung menyalakan modul Inventory, Transportation, atau POS Kasir secara instan dari registry tanpa perlu migrasi data ulang.
          </p>
        </div>

        <div class="el-faq-box">
          <h4 class="el-faq-q">Bagaimana keamanan data bisnis saya?</h4>
          <p class="el-faq-a">
            Setiap tenant berada di ruang terpisah (*Multi-Tenant Isolation*) dengan akses berbasis peran (*RBAC*), memastikan data rental Anda tidak dapat diakses tenant lain.
          </p>
        </div>

        <div class="el-faq-box">
          <h4 class="el-faq-q">Bisakah diakses via HP oleh pengemudi dan pelanggan?</h4>
          <p class="el-faq-a">
            Ya! Aplikasi web Seruwit responsif penuh dan mendukung Progressive Web App (PWA) yang ringan dan cepat dibuka dari browser smartphone apa pun.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA BANNER -->
  <section class="el-cta-section">
    <div class="el-container">
      <h2 class="el-cta-h2">Siap Membawa Bisnis Rental Anda ke Level Selanjutnya?</h2>
      <p class="el-cta-desc">
        Tingkatkan efisiensi armada, kendalikan pemesanan, dan bangun masa depan bisnis Anda bersama {{setting:general.site_name}}.
      </p>
      <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
        <a href="/workspaces" class="el-btn-glow" style="padding: 14px 34px; font-size: 1rem;">
          Buat Workspace Sekarang →
        </a>
        <a href="mailto:{{setting:site.contact_email}}" class="el-btn-secondary" style="padding: 14px 28px;">
          Hubungi Tim Kami
        </a>
      </div>
    </div>
  </section>

  <!-- MINIMALIST FOOTER -->
  <footer class="el-footer">
    <div class="el-container">
      <div class="el-footer-grid">
        <div class="el-footer-brand">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div class="el-brand-icon" style="width:26px; height:26px; font-size:0.8rem;">⚡</div>
            <h4 style="margin:0;">{{setting:general.site_name}}</h4>
          </div>
          <p>{{setting:general.site_tagline}}</p>
          <p style="font-size:0.8rem; color:#64748b;">
            📍 {{setting:site.address}}<br>
            📞 {{setting:site.phone}}<br>
            ✉️ {{setting:site.contact_email}}
          </p>
        </div>

        <div class="el-footer-col">
          <h5>Solusi Mobilitas</h5>
          <ul class="el-footer-menu">
            <li><a href="#rental">Rental Kendaraan</a></li>
            <li><a href="#rental">Shuttle &amp; Travel</a></li>
            <li><a href="#keunggulan">Live GPS Tracking</a></li>
            <li><a href="#keunggulan">Driver Management</a></li>
          </ul>
        </div>

        <div class="el-footer-col">
          <h5>Ekosistem Bisnis</h5>
          <ul class="el-footer-menu">
            <li><a href="#ekosistem">Logistik &amp; Gudang</a></li>
            <li><a href="#ekosistem">POS &amp; Canvassing</a></li>
            <li><a href="#ekosistem">Akuntansi &amp; Faktur</a></li>
            <li><a href="#ekosistem">B2B Marketplace</a></li>
          </ul>
        </div>

        <div class="el-footer-col">
          <h5>Platform &amp; Legal</h5>
          <ul class="el-footer-menu">
            <li><a href="/login">Masuk Workspace</a></li>
            <li><a href="/workspaces">Daftar Akun</a></li>
            <li><a href="/terms">Syarat &amp; Ketentuan</a></li>
            <li><a href="/privacy">Kebijakan Privasi</a></li>
          </ul>
        </div>
      </div>

      <div class="el-footer-bottom">
        <div>{{setting:site.copyright}}</div>
        <div style="color: #64748b;">Next-Gen Modular Mobility &amp; Business Operating System</div>
      </div>
    </div>
  </footer>

</div>
HTML;
    }
}

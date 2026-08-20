<?php

namespace Modules\Pages\Support;

class SeruwitElevateLandingTemplate
{
    /**
     * Build the data array for the Seruwit Elevate (Soft & Bright Edition) landing page.
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
    
    /* Soft & Bright Modern Palette */
    --el-bg: #f8fafc;
    --el-bg-surface: #ffffff;
    --el-bg-subtle: #f1f5f9;
    --el-bg-card: #ffffff;
    --el-bg-card-hover: #ffffff;
    
    --el-text-main: #0f172a;
    --el-text-body: #334155;
    --el-text-sub: #64748b;
    --el-text-muted: #94a3b8;
    
    /* Soft Accents & Pastels */
    --el-teal: #0d9488;
    --el-teal-dark: #0f766e;
    --el-teal-soft: #f0fdfa;
    --el-teal-border: #ccfbf1;
    
    --el-emerald: #059669;
    --el-emerald-soft: #ecfdf5;
    
    --el-cyan: #0284c7;
    --el-cyan-soft: #f0f9ff;
    
    --el-indigo: #4f46e5;
    --el-indigo-soft: #eef2ff;
    
    --el-amber: #d97706;
    --el-amber-soft: #fffbeb;
    
    /* Gradients */
    --el-grad-primary: linear-gradient(135deg, #0d9488 0%, #0284c7 100%);
    --el-grad-text: linear-gradient(135deg, #0f766e 0%, #0284c7 50%, #4338ca 100%);
    --el-grad-glow: radial-gradient(circle at 50% -12%, rgba(13, 148, 136, 0.12) 0%, rgba(2, 132, 199, 0.06) 45%, rgba(248, 250, 252, 0) 75%);
    
    /* Borders & Soft Shadows */
    --el-border: #e2e8f0;
    --el-border-light: #f1f5f9;
    --el-border-focus: #99f6e4;
    --el-shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02);
    --el-shadow-md: 0 4px 14px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
    --el-shadow-lg: 0 14px 28px -4px rgba(15, 23, 42, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.03);
    --el-shadow-card: 0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(226, 232, 240, 0.8);
    --el-shadow-glow: 0 12px 35px -8px rgba(13, 148, 136, 0.18);
}

.el-root {
    font-family: var(--el-font);
    color: var(--el-text-body);
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

/* FIXED NAVBAR WITH DYNAMIC SCROLL MORPH */
.el-nav-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 1000;
    padding: 16px 24px;
    pointer-events: none;
    transition: padding 0.35s cubic-bezier(0.16, 1, 0.3, 1), background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}
.el-navbar {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 100px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 10px 14px 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
/* Scrolled state: Morphs into Edge-to-Edge Full Width Glassmorphism Bar */
.el-nav-wrapper.scrolled {
    padding: 0;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.85);
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
}
.el-nav-wrapper.scrolled .el-navbar {
    max-width: 1200px;
    background: transparent;
    border-color: transparent;
    border-radius: 0;
    box-shadow: none;
    padding: 14px 24px;
}
.el-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    font-size: 1.12rem;
    font-weight: 800;
    color: var(--el-text-main);
    letter-spacing: -0.02em;
    flex-shrink: 0;
}
.el-brand-img {
    height: 32px;
    max-height: 36px;
    width: auto;
    max-width: 140px;
    object-fit: contain;
    display: inline-block;
    vertical-align: middle;
    border-radius: 6px;
}
.el-nav-links {
    display: flex;
    align-items: center;
    gap: 30px;
    list-style: none;
    margin: 0;
    padding: 0;
}
.el-nav-link {
    text-decoration: none;
    color: var(--el-text-body);
    font-size: 0.86rem;
    font-weight: 600;
    transition: all 0.2s ease;
    padding: 6px 12px;
    border-radius: 50px;
}
.el-nav-link:hover {
    color: var(--el-teal-dark);
    background: var(--el-bg-subtle);
}
.el-nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}
.el-lang-switcher {
    display: inline-flex;
    align-items: center;
    background: #f1f5f9;
    border: 1px solid var(--el-border);
    border-radius: 50px;
    padding: 2px 4px;
    font-size: 0.76rem;
    font-weight: 800;
}
.el-lang-btn {
    color: var(--el-text-sub);
    text-decoration: none;
    padding: 3px 8px;
    border-radius: 50px;
    transition: all 0.2s ease;
    line-height: 1;
}
.el-lang-btn:hover {
    color: var(--el-text-main);
}
.el-lang-btn.active {
    background: #ffffff;
    color: var(--el-teal-dark);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.el-lang-divider {
    color: #cbd5e1;
    font-size: 0.7rem;
    margin: 0 1px;
}
.el-btn-ghost {
    background: transparent;
    color: var(--el-text-body);
    font-size: 0.84rem;
    font-weight: 700;
    text-decoration: none;
    padding: 7px 14px;
    border-radius: 50px;
    transition: all 0.2s;
}
.el-btn-ghost:hover {
    color: var(--el-text-main);
    background: var(--el-bg-subtle);
}
.el-btn-glow {
    background: var(--el-grad-primary);
    color: #ffffff !important;
    font-size: 0.84rem;
    font-weight: 800;
    text-decoration: none;
    padding: 8px 18px;
    border-radius: 50px;
    box-shadow: 0 4px 14px rgba(13, 148, 136, 0.22);
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}
.el-btn-glow:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(13, 148, 136, 0.35);
    filter: brightness(1.04);
}

/* HERO SECTION */
.el-hero {
    position: relative;
    padding: 140px 0 90px 0;
    background: var(--el-grad-glow);
    text-align: center;
    overflow: hidden;
}
.el-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    border: 1px solid var(--el-teal-border);
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--el-teal-dark);
    margin-bottom: 22px;
    box-shadow: var(--el-shadow-sm);
}
.el-hero-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--el-teal);
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2);
}
.el-hero-h1 {
    font-size: clamp(2.4rem, 4.8vw, 3.8rem);
    font-weight: 800;
    color: var(--el-text-main);
    line-height: 1.18;
    letter-spacing: -0.03em;
    max-width: 920px;
    margin: 0 auto 22px auto;
}
.el-hero-h1 span {
    background: linear-gradient(135deg, #0f766e 0%, #0284c7 50%, #4338ca 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: #0f766e;
    display: inline;
}
.el-hero-p {
    font-size: 1.12rem;
    color: var(--el-text-body);
    max-width: 660px;
    margin: 0 auto 34px auto;
    line-height: 1.65;
}
.el-hero-btns {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 48px;
}
.el-btn-secondary {
    background: #ffffff;
    border: 1px solid var(--el-border);
    color: var(--el-text-main);
    font-size: 0.95rem;
    font-weight: 700;
    text-decoration: none;
    padding: 12px 26px;
    border-radius: 50px;
    transition: all 0.2s;
    box-shadow: var(--el-shadow-sm);
}
.el-btn-secondary:hover {
    background: var(--el-bg-subtle);
    border-color: #cbd5e1;
}

/* HERO INTERACTIVE DISPLAY (STAGE) */
.el-hero-stage {
    max-width: 1060px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 22px;
    box-shadow: var(--el-shadow-card), var(--el-shadow-glow);
    overflow: hidden;
    text-align: left;
}
.el-stage-header {
    background: #f8fafc;
    padding: 13px 22px;
    border-bottom: 1px solid var(--el-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.el-stage-controls {
    display: flex;
    gap: 7px;
}
.el-stage-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #cbd5e1;
}
.el-stage-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--el-text-body);
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
    background: #ffffff;
    color: var(--el-text-sub);
    border: 1px solid var(--el-border);
}
.el-stage-tab.active {
    background: var(--el-teal-soft);
    color: var(--el-teal-dark);
    border-color: var(--el-teal-border);
}

.el-stage-body {
    padding: 26px;
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 26px;
    align-items: center;
    background: #ffffff;
}
.el-stage-kpis {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}
.el-kpi-box {
    background: #f8fafc;
    border: 1px solid var(--el-border);
    border-radius: 14px;
    padding: 15px;
}
.el-kpi-num {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin-bottom: 2px;
}
.el-kpi-label {
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--el-text-sub);
}
.el-kpi-trend {
    font-size: 0.72rem;
    color: var(--el-emerald);
    font-weight: 700;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.el-live-radar {
    background: #f8fafc;
    border: 1px solid var(--el-border);
    border-radius: 16px;
    padding: 18px;
}
.el-radar-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border);
}
.el-radar-title {
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--el-text-main);
}
.el-radar-badge {
    font-size: 0.72rem;
    background: var(--el-teal-soft);
    color: var(--el-teal-dark);
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 700;
    border: 1px solid var(--el-teal-border);
}
.el-unit-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--el-border-light);
}
.el-unit-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
.el-unit-info h5 {
    margin: 0 0 2px 0;
    font-size: 0.86rem;
    color: var(--el-text-main);
    font-weight: 700;
}
.el-unit-info span {
    font-size: 0.75rem;
    color: var(--el-text-sub);
}
.el-unit-tag {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--el-cyan);
    background: var(--el-cyan-soft);
    padding: 3px 8px;
    border-radius: 6px;
}

/* SECTION ESSENTIALS */
.el-section {
    padding: 90px 0;
    position: relative;
}
.el-section-white {
    background: #ffffff;
}
.el-section-subtle {
    background: var(--el-bg);
}
.el-head-center {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 54px auto;
}
.el-tag-pill {
    display: inline-block;
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--el-teal-dark);
    background: var(--el-teal-soft);
    border: 1px solid var(--el-teal-border);
    padding: 5px 14px;
    border-radius: 50px;
    margin-bottom: 14px;
}
.el-title {
    font-size: clamp(1.9rem, 3.2vw, 2.6rem);
    font-weight: 800;
    color: var(--el-text-main);
    letter-spacing: -0.02em;
    line-height: 1.24;
    margin: 0 0 14px 0;
}
.el-subtitle {
    font-size: 1.05rem;
    color: var(--el-text-body);
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
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 18px;
    padding: 30px 26px;
    transition: all 0.25s ease;
    box-shadow: var(--el-shadow-sm);
    position: relative;
    overflow: hidden;
}
.el-adv-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #0d9488, #0284c7);
    opacity: 0;
    transition: opacity 0.25s ease;
}
.el-adv-card:hover {
    transform: translateY(-4px);
    border-color: #99f6e4;
    box-shadow: var(--el-shadow-lg);
}
.el-adv-card:hover::before {
    opacity: 1;
}
.el-adv-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--el-teal-soft);
    border: 1px solid var(--el-teal-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.45rem;
    margin-bottom: 20px;
    color: var(--el-teal-dark);
}
.el-adv-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0 0 10px 0;
}
.el-adv-desc {
    font-size: 0.92rem;
    color: var(--el-text-body);
    line-height: 1.6;
    margin: 0;
}

/* RENTAL SPOTLIGHT HIGHLIGHTS */
.el-spotlight-wrapper {
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 24px;
    padding: 44px;
    box-shadow: var(--el-shadow-md);
    margin-bottom: 36px;
}
.el-spotlight-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 44px;
    align-items: center;
}
.el-feat-pill-list {
    display: grid;
    gap: 14px;
    margin: 26px 0;
}
.el-feat-pill {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: #f8fafc;
    border: 1px solid var(--el-border);
    padding: 14px 18px;
    border-radius: 14px;
}
.el-feat-check {
    color: var(--el-teal);
    font-weight: 900;
    font-size: 1.1rem;
    margin-top: 1px;
}
.el-feat-pill-text h4 {
    margin: 0 0 2px 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--el-text-main);
}
.el-feat-pill-text p {
    margin: 0;
    font-size: 0.86rem;
    color: var(--el-text-body);
    line-height: 1.5;
}

/* MODULAR EXPANSION ECOSYSTEM */
.el-eco-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}
.el-eco-box {
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 18px;
    padding: 28px;
    box-shadow: var(--el-shadow-sm);
    transition: all 0.2s ease;
}
.el-eco-box:hover {
    border-color: #99f6e4;
    box-shadow: var(--el-shadow-md);
}
.el-eco-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}
.el-eco-icon-sm {
    font-size: 1.4rem;
}
.el-eco-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0;
}
.el-eco-summary {
    font-size: 0.92rem;
    color: var(--el-text-body);
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
    background: var(--el-bg-subtle);
    color: var(--el-text-body);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--el-border);
}
.el-tag-live {
    background: var(--el-teal-soft);
    color: var(--el-teal-dark);
    border-color: var(--el-teal-border);
}

/* HORIZON MARKETPLACE CALLOUT */
.el-market-callout {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    border-radius: 20px;
    padding: 36px 40px;
    margin-top: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    box-shadow: var(--el-shadow-lg);
}
.el-market-text h3 {
    font-size: 1.35rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 8px 0;
}
.el-market-text p {
    font-size: 0.94rem;
    color: #94a3b8;
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
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 18px;
    padding: 30px 24px;
    box-shadow: var(--el-shadow-sm);
    position: relative;
}
.el-step-badge {
    font-size: 0.85rem;
    font-weight: 900;
    color: #ffffff;
    background: var(--el-grad-primary);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}
.el-step-h {
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0 0 10px 0;
}
.el-step-p {
    font-size: 0.92rem;
    color: var(--el-text-body);
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
    background: #ffffff;
    border: 1px solid var(--el-border);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--el-shadow-sm);
}
.el-faq-q {
    font-size: 1rem;
    font-weight: 800;
    color: var(--el-text-main);
    margin: 0 0 8px 0;
}
.el-faq-a {
    font-size: 0.92rem;
    color: var(--el-text-body);
    line-height: 1.6;
    margin: 0;
}

/* CTA BANNER */
.el-cta-section {
    background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0284c7 100%);
    color: #ffffff;
    padding: 80px 0;
    text-align: center;
}
.el-cta-h2 {
    font-size: clamp(2rem, 3.5vw, 2.8rem);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 14px 0;
    letter-spacing: -0.02em;
}
.el-cta-desc {
    font-size: 1.08rem;
    color: rgba(255, 255, 255, 0.92);
    max-width: 600px;
    margin: 0 auto 34px auto;
    line-height: 1.6;
}
.el-btn-white {
    background: #ffffff;
    color: var(--el-teal-dark) !important;
    font-weight: 800;
    padding: 13px 32px;
    border-radius: 50px;
    font-size: 0.95rem;
    text-decoration: none;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    display: inline-block;
}
.el-btn-white:hover {
    background: #f8fafc;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* FOOTER */
.el-footer {
    background: #0f172a;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 60px 0 30px 0;
    color: #94a3b8;
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
    color: #94a3b8;
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
    color: #cbd5e1;
    text-decoration: none;
    font-size: 0.86rem;
    transition: color 0.2s;
}
.el-footer-menu li a:hover {
    color: #38bdf8;
}
.el-footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
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
    .el-nav-wrapper {
        padding: 10px 10px;
    }
    .el-nav-wrapper.scrolled {
        padding: 0;
    }
    .el-nav-wrapper.scrolled .el-navbar {
        padding: 8px 14px;
    }
    .el-navbar {
        padding: 6px 8px 6px 14px;
    }
    .el-hero {
        padding-top: 110px;
    }
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

  <!-- SLEEK FIXED NAVBAR -->
  <div class="el-nav-wrapper">
    <nav class="el-navbar">
      <a href="/" class="el-brand">
        <img src="{{setting:site.logo}}" alt="{{setting:general.site_name}}" class="el-brand-img" onerror="this.style.display='none';" />
        <span>{{setting:general.site_name}}</span>
      </a>

      <ul class="el-nav-links">
        <li><a href="#rental" class="el-nav-link">{{trans:landing_elevate.nav.rental}}</a></li>
        <li><a href="#keunggulan" class="el-nav-link">{{trans:landing_elevate.nav.advantages}}</a></li>
        <li><a href="#ekosistem" class="el-nav-link">{{trans:landing_elevate.nav.ecosystem}}</a></li>
      </ul>

      <div class="el-nav-actions">
        <div class="el-lang-switcher">
          <a href="?lang=id" class="el-lang-btn {{locale_active:id}}" title="Bahasa Indonesia">ID</a>
          <span class="el-lang-divider">|</span>
          <a href="?lang=en" class="el-lang-btn {{locale_active:en}}" title="English">EN</a>
        </div>
        <a href="/login" class="el-btn-ghost">{{trans:landing_elevate.nav.login}}</a>
        <a href="/register" class="el-btn-glow">{{trans:landing_elevate.nav.cta}}</a>
      </div>
    </nav>
  </div>

  <!-- HERO SECTION -->
  <header class="el-hero">
    <div class="el-container">
      <div class="el-hero-badge">
        <span class="el-hero-dot"></span> {{trans:landing_elevate.hero.badge}}
      </div>
      
      <h1 class="el-hero-h1">
        {{trans:landing_elevate.hero.title_p1}} <span>{{trans:landing_elevate.hero.title_highlight}}</span>
      </h1>

      <p class="el-hero-p">
        {{trans:landing_elevate.hero.subtitle}}
      </p>

      <div class="el-hero-btns">
        <a href="/register" class="el-btn-glow" style="padding: 13px 30px; font-size: 0.96rem;">
          {{trans:landing_elevate.hero.cta_primary}}
        </a>
        <a href="#keunggulan" class="el-btn-secondary">
          {{trans:landing_elevate.hero.cta_secondary}} ↓
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
          <div class="el-stage-title">{{trans:landing_elevate.control_hub.title}} • Multi-Tenant Active</div>
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
              <div class="el-kpi-label">{{trans:landing_elevate.control_hub.active_units}}</div>
              <div class="el-kpi-trend">↑ 92.3% {{trans:landing_elevate.control_hub.utilization}}</div>
            </div>
            <div class="el-kpi-box">
              <div class="el-kpi-num">Rp 128M</div>
              <div class="el-kpi-label">{{trans:landing_elevate.control_hub.revenue_today}}</div>
              <div class="el-kpi-trend">↑ +18.5% Growth</div>
            </div>
            <div class="el-kpi-box">
              <div class="el-kpi-num">24 Unit</div>
              <div class="el-kpi-label">{{trans:landing_elevate.control_hub.status_on_trip}}</div>
              <div class="el-kpi-trend">✓ KYC Verified 100%</div>
            </div>
            <div class="el-kpi-box">
              <div class="el-kpi-num">12 Trip</div>
              <div class="el-kpi-label">{{trans:landing_elevate.control_hub.status_ready}}</div>
              <div class="el-kpi-trend">📍 {{trans:landing_elevate.control_hub.badge_gps}}</div>
            </div>
          </div>

          <div class="el-live-radar">
            <div class="el-radar-head">
              <span class="el-radar-title">Real-Time Fleet Radar</span>
              <span class="el-radar-badge">● Live GPS Tracking</span>
            </div>

            <div class="el-unit-item">
              <div class="el-unit-info">
                <h5>Toyota Innova Zenix Hybrid (B 1829 SSR)</h5>
                <span>Self Drive • Route: Sudirman → Soetta Airport</span>
              </div>
              <span class="el-unit-tag">Moving (65 km/h)</span>
            </div>

            <div class="el-unit-item">
              <div class="el-unit-info">
                <h5>Toyota Fortuner 2.8 GR (B 2091 PLK)</h5>
                <span>With Driver • Hotel Mulia Senayan</span>
              </div>
              <span class="el-unit-tag" style="color:#059669; background:#ecfdf5;">Standby Ready</span>
            </div>

            <div class="el-unit-item">
              <div class="el-unit-info">
                <h5>Toyota HiAce Premio Shuttle (D 7781 AB)</h5>
                <span>Shuttle: Bandung Pasteur → Jakarta Semanggi</span>
              </div>
              <span class="el-unit-tag" style="color:#4f46e5; background:#eef2ff;">12 Seats (Full)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- KEUNGGULAN PRODUK UTAMA -->
  <section class="el-section el-section-white" id="keunggulan">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">{{trans:landing_elevate.advantages.tag}}</span>
        <h2 class="el-title">{{trans:landing_elevate.advantages.title}}</h2>
        <p class="el-subtitle">
          {{trans:landing_elevate.advantages.subtitle}}
        </p>
      </div>

      <div class="el-advantages-grid">
        <div class="el-adv-card">
          <div class="el-adv-icon">🎯</div>
          <h3 class="el-adv-title">{{trans:landing_elevate.advantages.calendar_title}}</h3>
          <p class="el-adv-desc">
            {{trans:landing_elevate.advantages.calendar_desc}}
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">🛡️</div>
          <h3 class="el-adv-title">{{trans:landing_elevate.advantages.kyc_title}}</h3>
          <p class="el-adv-desc">
            {{trans:landing_elevate.advantages.kyc_desc}}
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">📍</div>
          <h3 class="el-adv-title">{{trans:landing_elevate.advantages.gps_title}}</h3>
          <p class="el-adv-desc">
            {{trans:landing_elevate.advantages.gps_desc}}
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">🧩</div>
          <h3 class="el-adv-title">{{trans:landing_elevate.advantages.modular_title}}</h3>
          <p class="el-adv-desc">
            {{trans:landing_elevate.advantages.modular_desc}}
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">⚡</div>
          <h3 class="el-adv-title">{{trans:landing_elevate.advantages.tenant_title}}</h3>
          <p class="el-adv-desc">
            {{trans:landing_elevate.advantages.tenant_desc}}
          </p>
        </div>

        <div class="el-adv-card">
          <div class="el-adv-icon">💳</div>
          <h3 class="el-adv-title">{{trans:landing_elevate.advantages.invoice_title}}</h3>
          <p class="el-adv-desc">
            {{trans:landing_elevate.advantages.invoice_desc}}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- SPOTLIGHT: RENTAL & MOBILITAS -->
  <section class="el-section el-section-subtle" id="rental">
    <div class="el-container">
      <div class="el-spotlight-wrapper">
        <div class="el-spotlight-grid">
          <div>
            <span class="el-tag-pill">{{trans:landing_elevate.rental_spotlight.tag}}</span>
            <h2 class="el-title" style="font-size: 2.3rem; margin: 10px 0 16px 0;">
              {{trans:landing_elevate.rental_spotlight.title}}
            </h2>
            <p class="el-subtitle" style="font-size: 1rem;">
              {{trans:landing_elevate.rental_spotlight.subtitle}}
            </p>

            <div class="el-feat-pill-list">
              <div class="el-feat-pill">
                <span class="el-feat-check">✓</span>
                <div class="el-feat-pill-text">
                  <h4>{{trans:landing_elevate.rental_spotlight.pill1_title}}</h4>
                  <p>{{trans:landing_elevate.rental_spotlight.pill1_desc}}</p>
                </div>
              </div>

              <div class="el-feat-pill">
                <span class="el-feat-check">✓</span>
                <div class="el-feat-pill-text">
                  <h4>{{trans:landing_elevate.rental_spotlight.pill2_title}}</h4>
                  <p>{{trans:landing_elevate.rental_spotlight.pill2_desc}}</p>
                </div>
              </div>

              <div class="el-feat-pill">
                <span class="el-feat-check">✓</span>
                <div class="el-feat-pill-text">
                  <h4>{{trans:landing_elevate.rental_spotlight.pill3_title}}</h4>
                  <p>{{trans:landing_elevate.rental_spotlight.pill3_desc}}</p>
                </div>
              </div>

              <div class="el-feat-pill">
                <span class="el-feat-check">✓</span>
                <div class="el-feat-pill-text">
                  <h4>{{trans:landing_elevate.rental_spotlight.pill4_title}}</h4>
                  <p>{{trans:landing_elevate.rental_spotlight.pill4_desc}}</p>
                </div>
              </div>
            </div>

            <a href="/register" class="el-btn-glow">{{trans:landing_elevate.nav.cta}}</a>
          </div>

          <!-- LIST KENDARAAN POPULER -->
          <div style="display: grid; gap: 14px;">
            <div style="background:#ffffff; border:1px solid var(--el-border); border-radius:18px; padding:20px; display:flex; justify-content:space-between; align-items:center; box-shadow: var(--el-shadow-sm);">
              <div>
                <span style="font-size:0.72rem; color:var(--el-cyan); font-weight:800; text-transform:uppercase;">SUV Luxury</span>
                <h4 style="font-size:1.1rem; font-weight:800; color:var(--el-text-main); margin:4px 0 6px 0;">Toyota Fortuner 2.8 GR Sport</h4>
                <div style="font-size:0.82rem; color:var(--el-text-body);">👥 7 Seats • ⚙️ Automatic • ⛽ Diesel</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.15rem; font-weight:800; color:var(--el-teal-dark);">Rp 850k<span style="font-size:0.75rem; color:var(--el-text-sub);">/day</span></div>
                <span style="font-size:0.72rem; background:var(--el-emerald-soft); color:var(--el-emerald); padding:3px 8px; border-radius:4px; font-weight:700;">{{trans:landing_elevate.control_hub.status_ready}}</span>
              </div>
            </div>

            <div style="background:#ffffff; border:1px solid var(--el-border); border-radius:18px; padding:20px; display:flex; justify-content:space-between; align-items:center; box-shadow: var(--el-shadow-sm);">
              <div>
                <span style="font-size:0.72rem; color:var(--el-indigo); font-weight:800; text-transform:uppercase;">Premium Shuttle</span>
                <h4 style="font-size:1.1rem; font-weight:800; color:var(--el-text-main); margin:4px 0 6px 0;">Toyota HiAce Premio Luxury</h4>
                <div style="font-size:0.82rem; color:var(--el-text-body);">👥 10 Seats • 🛋️ Captain Seat • 👨‍✈️ Driver Included</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.15rem; font-weight:800; color:var(--el-teal-dark);">Rp 1.4M<span style="font-size:0.75rem; color:var(--el-text-sub);">/day</span></div>
                <span style="font-size:0.72rem; background:var(--el-emerald-soft); color:var(--el-emerald); padding:3px 8px; border-radius:4px; font-weight:700;">{{trans:landing_elevate.control_hub.status_ready}}</span>
              </div>
            </div>

            <div style="background:#ffffff; border:1px solid var(--el-border); border-radius:18px; padding:20px; display:flex; justify-content:space-between; align-items:center; box-shadow: var(--el-shadow-sm);">
              <div>
                <span style="font-size:0.72rem; color:var(--el-amber); font-weight:800; text-transform:uppercase;">Family MPV</span>
                <h4 style="font-size:1.1rem; font-weight:800; color:var(--el-text-main); margin:4px 0 6px 0;">Toyota All New Avanza / Veloz</h4>
                <div style="font-size:0.82rem; color:var(--el-text-body);">👥 7 Seats • ⚙️ Auto/Manual • ❄️ Double AC</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.15rem; font-weight:800; color:var(--el-teal-dark);">Rp 400k<span style="font-size:0.75rem; color:var(--el-text-sub);">/day</span></div>
                <span style="font-size:0.72rem; background:var(--el-emerald-soft); color:var(--el-emerald); padding:3px 8px; border-radius:4px; font-weight:700;">{{trans:landing_elevate.control_hub.status_ready}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ARSITEKTUR EKOSISTEM MASA DEPAN -->
  <section class="el-section el-section-white" id="ekosistem">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">{{trans:landing_elevate.ecosystem.tag}}</span>
        <h2 class="el-title">{{trans:landing_elevate.ecosystem.title}}</h2>
        <p class="el-subtitle">
          {{trans:landing_elevate.ecosystem.subtitle}}
        </p>
      </div>

      <div class="el-eco-grid">
        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">🚚</span>
            <h3 class="el-eco-name">{{trans:landing_elevate.ecosystem.logistics_title}}</h3>
          </div>
          <p class="el-eco-summary">
            {{trans:landing_elevate.ecosystem.logistics_desc}}
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">Inventory Multi-Warehouse</span>
            <span class="el-tag el-tag-live">PO &amp; Purchasing</span>
            <span class="el-tag el-tag-live">Proof of Delivery (POD)</span>
            <span class="el-tag el-tag-live">Dispatch Outbound</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">🛍️</span>
            <h3 class="el-eco-name">{{trans:landing_elevate.ecosystem.pos_title}}</h3>
          </div>
          <p class="el-eco-summary">
            {{trans:landing_elevate.ecosystem.pos_desc}}
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">POS Outlets</span>
            <span class="el-tag el-tag-live">Sales Canvassing</span>
            <span class="el-tag el-tag-live">Trade Promotions</span>
            <span class="el-tag el-tag-live">Product Master</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">💼</span>
            <h3 class="el-eco-name">{{trans:landing_elevate.ecosystem.finance_title}}</h3>
          </div>
          <p class="el-eco-summary">
            {{trans:landing_elevate.ecosystem.finance_desc}}
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">Automated Invoicing</span>
            <span class="el-tag el-tag-live">AR / AP Aging</span>
            <span class="el-tag el-tag-live">General Ledger (GL)</span>
            <span class="el-tag el-tag-live">Approval Matrix</span>
          </div>
        </div>

        <div class="el-eco-box">
          <div class="el-eco-top">
            <span class="el-eco-icon-sm">⚡</span>
            <h3 class="el-eco-name">{{trans:landing_elevate.ecosystem.inventory_title}}</h3>
          </div>
          <p class="el-eco-summary">
            {{trans:landing_elevate.ecosystem.inventory_desc}}
          </p>
          <div class="el-eco-tags">
            <span class="el-tag el-tag-live">Vehicle Rental</span>
            <span class="el-tag el-tag-live">Shuttle Travel</span>
            <span class="el-tag el-tag-live">Driver Scoring</span>
            <span class="el-tag el-tag-live">Fleet Maintenance</span>
          </div>
        </div>
      </div>

      <!-- HORIZON MARKETPLACE CALLOUT -->
      <div class="el-market-callout">
        <div class="el-market-text">
          <span style="font-size:0.75rem; color:#38bdf8; font-weight:800; text-transform:uppercase;">{{trans:landing_elevate.ecosystem.market_badge}}</span>
          <h3>🌐 {{trans:landing_elevate.ecosystem.market_title}}</h3>
          <p>
            {{trans:landing_elevate.ecosystem.market_desc}}
          </p>
        </div>
        <div>
          <a href="/register" class="el-btn-glow" style="white-space:nowrap; background:#ffffff; color:#0f172a !important;">{{trans:landing_elevate.ecosystem.market_cta}}</a>
        </div>
      </div>
    </div>
  </section>

  <!-- CARA KERJA -->
  <section class="el-section el-section-subtle" id="cara-kerja">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">{{trans:landing_elevate.workflow.tag}}</span>
        <h2 class="el-title">{{trans:landing_elevate.workflow.title}}</h2>
        <p class="el-subtitle">{{trans:landing_elevate.workflow.subtitle}}</p>
      </div>

      <div class="el-steps-grid">
        <div class="el-step-item">
          <div class="el-step-badge">{{trans:landing_elevate.workflow.step1_num}}</div>
          <h3 class="el-step-h">{{trans:landing_elevate.workflow.step1_title}}</h3>
          <p class="el-step-p">{{trans:landing_elevate.workflow.step1_desc}}</p>
        </div>

        <div class="el-step-item">
          <div class="el-step-badge">{{trans:landing_elevate.workflow.step2_num}}</div>
          <h3 class="el-step-h">{{trans:landing_elevate.workflow.step2_title}}</h3>
          <p class="el-step-p">{{trans:landing_elevate.workflow.step2_desc}}</p>
        </div>

        <div class="el-step-item">
          <div class="el-step-badge">{{trans:landing_elevate.workflow.step3_num}}</div>
          <h3 class="el-step-h">{{trans:landing_elevate.workflow.step3_title}}</h3>
          <p class="el-step-p">{{trans:landing_elevate.workflow.step3_desc}}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="el-section el-section-white" id="faq">
    <div class="el-container">
      <div class="el-head-center">
        <span class="el-tag-pill">{{trans:landing_elevate.faq.tag}}</span>
        <h2 class="el-title">{{trans:landing_elevate.faq.title}}</h2>
      </div>

      <div class="el-faq-grid">
        <div class="el-faq-box">
          <h4 class="el-faq-q">{{trans:landing_elevate.faq.q1}}</h4>
          <p class="el-faq-a">{{trans:landing_elevate.faq.a1}}</p>
        </div>

        <div class="el-faq-box">
          <h4 class="el-faq-q">{{trans:landing_elevate.faq.q2}}</h4>
          <p class="el-faq-a">{{trans:landing_elevate.faq.a2}}</p>
        </div>

        <div class="el-faq-box">
          <h4 class="el-faq-q">{{trans:landing_elevate.faq.q3}}</h4>
          <p class="el-faq-a">{{trans:landing_elevate.faq.a3}}</p>
        </div>

        <div class="el-faq-box">
          <h4 class="el-faq-q">{{trans:landing_elevate.faq.q4}}</h4>
          <p class="el-faq-a">{{trans:landing_elevate.faq.a4}}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA BANNER -->
  <section class="el-cta-section">
    <div class="el-container">
      <h2 class="el-cta-h2">{{trans:landing_elevate.cta_bottom.title}}</h2>
      <p class="el-cta-desc">
        {{trans:landing_elevate.cta_bottom.subtitle}}
      </p>
      <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
        <a href="/register" class="el-btn-white">
          {{trans:landing_elevate.cta_bottom.btn_primary}} →
        </a>
        <a href="mailto:{{setting:site.contact_email}}" class="el-btn-secondary" style="background:rgba(255,255,255,0.15); color:#ffffff; border-color:rgba(255,255,255,0.3);">
          {{trans:landing_elevate.cta_bottom.btn_sales}}
        </a>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="el-footer">
    <div class="el-container">
      <div class="el-footer-grid">
        <div class="el-footer-brand">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <img src="{{setting:site.logo}}" alt="{{setting:general.site_name}}" class="el-brand-img" style="height:26px;" onerror="this.style.display='none';" />
            <h4 style="margin:0;">{{setting:general.site_name}}</h4>
          </div>
          <p>{{setting:general.site_tagline}}</p>
          <p style="font-size:0.8rem; color:#94a3b8;">
            📍 {{setting:site.address}}<br>
            📞 {{setting:site.phone}}<br>
            ✉️ {{setting:site.contact_email}}
          </p>
        </div>

        <div class="el-footer-col">
          <h5>{{trans:landing_elevate.footer.mobility_title}}</h5>
          <ul class="el-footer-menu">
            <li><a href="#rental">{{trans:landing_elevate.footer.rental_car}}</a></li>
            <li><a href="#rental">{{trans:landing_elevate.footer.shuttle}}</a></li>
            <li><a href="#keunggulan">{{trans:landing_elevate.footer.gps_live}}</a></li>
            <li><a href="#keunggulan">{{trans:landing_elevate.footer.driver_mgmt}}</a></li>
          </ul>
        </div>

        <div class="el-footer-col">
          <h5>{{trans:landing_elevate.footer.eco_title}}</h5>
          <ul class="el-footer-menu">
            <li><a href="#ekosistem">{{trans:landing_elevate.footer.logistics_wh}}</a></li>
            <li><a href="#ekosistem">{{trans:landing_elevate.footer.pos_field}}</a></li>
            <li><a href="#ekosistem">{{trans:landing_elevate.footer.finance_inv}}</a></li>
            <li><a href="#ekosistem">{{trans:landing_elevate.footer.b2b_market}}</a></li>
          </ul>
        </div>

        <div class="el-footer-col">
          <h5>{{trans:landing_elevate.footer.platform_title}}</h5>
          <ul class="el-footer-menu">
            <li><a href="/login">{{trans:landing_elevate.footer.login}}</a></li>
            <li><a href="/register">{{trans:landing_elevate.footer.register}}</a></li>
            <li><a href="/terms">{{trans:landing_elevate.footer.terms}}</a></li>
            <li><a href="/privacy">{{trans:landing_elevate.footer.privacy}}</a></li>
          </ul>
        </div>
      </div>

      <div class="el-footer-bottom">
        <div>{{setting:site.copyright}}</div>
        <div style="color: #94a3b8;">{{trans:landing_elevate.footer.subtext}}</div>
      </div>
    </div>
  </footer>

  <script>
    (function() {
      var navWrapper = document.querySelector('.el-nav-wrapper');
      if (!navWrapper) return;
      
      function onScroll() {
        if (window.scrollY > 30) {
          navWrapper.classList.add('scrolled');
        } else {
          navWrapper.classList.remove('scrolled');
        }
      }
      
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    })();
  </script>

</div>
HTML;
    }
}
